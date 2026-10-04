import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import MediaAssetModel from "@/models/MediaAsset";

/** E-detailing material for the employee's division (or for everyone). */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const items = await MediaAssetModel.find({
    isActive: { $ne: false },
    division: { $in: [auth.employee.division, "", null] },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({ items });
}
