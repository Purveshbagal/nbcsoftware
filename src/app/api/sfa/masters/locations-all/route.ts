import { NextResponse } from "next/server";

import { requireUser } from "@/lib/sfa-auth";
import MasterItemModel from "@/models/MasterItem";

/**
 * Get all location data in hierarchical format for cascading dropdowns
 * GET /api/sfa/masters/locations-all
 * Returns: {
 *   districts: [{ name, talukas: [{ name, villages: [name, ...] }] }]
 * }
 */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  try {
    // Load all locations at once
    const [districts, talukas, villages] = await Promise.all([
      MasterItemModel.find({ type: "district", isActive: true })
        .select("name parent")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      MasterItemModel.find({ type: "taluka", isActive: true })
        .select("name parent")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      MasterItemModel.find({ type: "village", isActive: true })
        .select("name parent")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ]);

    // Build hierarchical structure
    const hierarchy = districts.map((district) => {
      const districtTalukas = talukas
        .filter((t) => t.parent === district.name)
        .map((taluka) => ({
          name: taluka.name,
          villages: villages
            .filter((v) => v.parent === taluka.name)
            .map((v) => v.name),
        }));

      return {
        name: district.name,
        talukas: districtTalukas,
      };
    });

    // Also provide flat lists for simple dropdowns
    const flatData = {
      states: ["Maharashtra"],
      districts: districts.map((d) => d.name),
      talukas: talukas.map((t) => ({ name: t.name, district: t.parent })),
      villages: villages.map((v) => ({ name: v.name, taluka: v.parent })),
    };

    return NextResponse.json({
      hierarchy,
      flat: flatData,
    });
  } catch (error: any) {
    console.error("Error loading locations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load locations" },
      { status: 500 }
    );
  }
}
