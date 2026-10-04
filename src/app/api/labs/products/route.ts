import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import SfaProductModel from "@/models/SfaProduct";

/** The active product catalogue, for detailing and order lines. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const items = await SfaProductModel.find({ isActive: { $ne: false } })
    .select("code name composition pack division productGroup indication uom mrp ptr pts")
    .sort({ name: 1 })
    .limit(2000)
    .lean();

  return NextResponse.json({ items });
}
