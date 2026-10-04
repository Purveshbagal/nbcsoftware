import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureProductCatalog } from "@/lib/product-catalog";
import ProductModel from "@/models/Product";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  await ensureProductCatalog();

  const products = await ProductModel.find().sort({ name: 1 });

  return NextResponse.json({ products });
}
