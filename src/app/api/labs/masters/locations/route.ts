import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import MasterItemModel from "@/models/MasterItem";

/**
 * Hierarchical location endpoint for mobile app
 * GET /api/labs/masters/locations?type=district&parent=Maharashtra
 * GET /api/labs/masters/locations?type=taluka&parent=Pune
 * GET /api/labs/masters/locations?type=village&parent=Haveli
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const parent = url.searchParams.get("parent");

  if (!type) {
    return NextResponse.json({ error: "type parameter is required" }, { status: 400 });
  }

  const validTypes = ["state", "district", "taluka", "village"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const query: any = { type, isActive: true };
  if (parent) {
    query.parent = parent;
  }

  const items = await MasterItemModel.find(query)
    .select("name parent")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const options = items.map((item) => ({
    name: item.name,
    parent: item.parent,
  }));

  return NextResponse.json({ options });
}
