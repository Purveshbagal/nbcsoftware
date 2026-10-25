import { NextResponse } from "next/server";

import { referenceNumber } from "@/lib/labs-crud";
import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import SampleRequestModel from "@/models/SampleRequest";
import VisitModel from "@/models/Visit";

type RequestedItem = { productName?: string; quantity?: number };

async function balancesFor(employeeName: string) {
  const [approved, used] = await Promise.all([
    SampleRequestModel.find({ employeeName, itemType: "sample", status: "approved" }).lean(),
    VisitModel.find({ employeeName, status: "closed" }).select("samplesGiven").lean(),
  ]);
  const balances = new Map<string, number>();
  for (const row of approved) balances.set(row.item, (balances.get(row.item) ?? 0) + row.quantity);
  for (const visit of used) for (const sample of visit.samplesGiven ?? []) {
    balances.set(sample.productName, (balances.get(sample.productName) ?? 0) - sample.quantity);
  }
  return Object.fromEntries([...balances.entries()].map(([item, quantity]) => [item, Math.max(0, quantity)]));
}

export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const employeeName = auth.employee.name;
  const [items, balances] = await Promise.all([
    SampleRequestModel.find({ employeeName, itemType: "sample" }).sort({ createdAt: -1 }).lean(),
    balancesFor(employeeName),
  ]);
  return NextResponse.json({ items, balances });
}

export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const body = await readJsonBody(request) as { items?: RequestedItem[]; remarks?: string } | null;
  const items = (body?.items ?? []).filter((row) => row.productName?.trim() && Number(row.quantity) > 0);
  if (!items.length) return NextResponse.json({ error: "Add at least one product with a quantity." }, { status: 400 });
  const employee = auth.employee;
  const created = await SampleRequestModel.insertMany(items.map((row) => ({
    requestNo: referenceNumber("SR"), requestDate: istDateKey(new Date()), employeeName: employee.name,
    zone: employee.zone, division: employee.division, itemType: "sample", item: row.productName!.trim(),
    quantity: Number(row.quantity), remarks: String(body?.remarks ?? "").trim(), status: "pending",
    createdBy: { username: employee.username, name: employee.name },
  })));
  return NextResponse.json({ items: created }, { status: 201 });
}
