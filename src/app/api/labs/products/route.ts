import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import SfaProductModel from "@/models/SfaProduct";

// The detailing list must be available on the field app even before an admin
// has populated the SFA Product Master. These are the products supplied in
// the call-report specification; master entries with the same name override
// this fallback when present.
const VISIT_PRODUCTS = [
  "Pulminase Respule",
  "Relymox CV Forte Dry Syrup",
  "Tinycold DS Suspension",
  "Totsberry LS Junior Syrup 60ml",
  "Totsberry LS Syrup",
  "Tinycold AF Suspension",
  "Tinycold Suspension 60ml",
  "Bactomust 5gm Ointment",
  "Duotwist LD Respules",
  "Nazocure Jr Nasal Spray",
  "Nazocure Saline Nasal Spray",
  "Oneset Syrup",
  "Pediagesic Forte Suspension",
  "Pediagesic P Syrup",
];

/** The active product catalogue, for detailing and order lines. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const items = await SfaProductModel.find({ isActive: { $ne: false } })
    .select("code name composition pack division productGroup indication uom mrp ptr pts")
    .sort({ name: 1 })
    .limit(2000)
    .lean();

  const existing = new Set(items.map((item) => item.name.trim().toLowerCase()));
  const fallback = VISIT_PRODUCTS.filter((name) => !existing.has(name.toLowerCase())).map((name) => ({
    _id: `visit-product:${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
    code: "",
    name,
    composition: "",
    pack: "",
  }));

  return NextResponse.json({ items: [...items, ...fallback] });
}
