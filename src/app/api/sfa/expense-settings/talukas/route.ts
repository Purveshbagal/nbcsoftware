import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import MasterItemModel from "@/models/MasterItem";

/**
 * GET /api/sfa/expense-settings/talukas
 * Get all talukas with their districts
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const talukas = await MasterItemModel.find({ type: "taluka", isActive: true })
    .select("name parent")
    .sort({ parent: 1, name: 1 })
    .lean();

  return NextResponse.json({
    talukas: talukas.map((t) => ({
      name: t.name,
      district: t.parent || "",
    })),
  });
}
