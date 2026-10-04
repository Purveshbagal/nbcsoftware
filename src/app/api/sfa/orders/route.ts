import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { normaliseOrderBody } from "@/lib/order-payload";
import { readJsonBody } from "@/lib/read-json";
import OrderModel from "@/models/Order";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const query: Record<string, unknown> = {};
  for (const key of ["status", "zone", "division", "firm"]) {
    const value = url.searchParams.get(key);
    if (value) query[key] = value;
  }

  await connectToDatabase();
  const items = await OrderModel.find(query).sort({ orderDate: -1 }).limit(500).lean();

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const doc = normaliseOrderBody(body, true);

  if (!doc.orderDate) {
    return NextResponse.json({ error: "Order date is required" }, { status: 400 });
  }

  await connectToDatabase();
  const created = await OrderModel.create({
    ...doc,
    createdBy: { username: session.username, name: session.name },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
