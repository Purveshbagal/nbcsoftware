import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { referenceNumber } from "@/lib/labs-crud";
import { normaliseOrderBody } from "@/lib/order-payload";
import { readJsonBody } from "@/lib/read-json";
import OrderModel from "@/models/Order";

/** The employee's own orders, newest first. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const items = await OrderModel.find({ employeeName: auth.employee.name })
    .sort({ orderDate: -1, createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({ items });
}

/** Book an order (POB) for a firm. Approval stays with the office. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const doc = normaliseOrderBody(body, true);
  const lines = doc.lines as { quantity: number }[];

  if (!doc.firm) {
    return NextResponse.json({ error: "Choose the firm this order is for" }, { status: 400 });
  }
  if (lines.length === 0 || lines.some((line) => line.quantity <= 0)) {
    return NextResponse.json({ error: "Add at least one product with a quantity" }, { status: 400 });
  }

  const item = await OrderModel.create({
    ...doc,
    orderNo: referenceNumber("OR"),
    orderDate: istDateKey(),
    employeeName: employee.name,
    zone: employee.zone,
    division: employee.division,
    status: "placed",
    createdBy: { username: employee.username, name: employee.name },
  });

  return NextResponse.json({ item }, { status: 201 });
}
