import { NextResponse } from "next/server";

import { requireUser } from "@/lib/sfa-auth";
import MasterItemModel from "@/models/MasterItem";

/**
 * Cascading delete for locations
 * DELETE /api/sfa/locations/delete?type=district&name=Pune
 * - Deletes district and all its talukas and villages
 * DELETE /api/sfa/locations/delete?type=taluka&name=Haveli
 * - Deletes taluka and all its villages
 * DELETE /api/sfa/locations/delete?type=village&name=Kharadi
 * - Deletes only the village
 */
export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const name = url.searchParams.get("name");

  if (!type || !name) {
    return NextResponse.json(
      { error: "type and name parameters are required" },
      { status: 400 }
    );
  }

  const validTypes = ["district", "taluka", "village"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    let deletedCount = 0;

    if (type === "district") {
      // Delete district, all talukas, and all villages

      // First find all talukas in this district
      const talukas = await MasterItemModel.find({
        type: "taluka",
        parent: name,
      }).lean();

      const talukaNames = talukas.map((t) => t.name);

      // Delete all villages in all talukas
      if (talukaNames.length > 0) {
        const villagesResult = await MasterItemModel.deleteMany({
          type: "village",
          parent: { $in: talukaNames },
        });
        deletedCount += villagesResult.deletedCount || 0;
      }

      // Delete all talukas in this district
      const talukasResult = await MasterItemModel.deleteMany({
        type: "taluka",
        parent: name,
      });
      deletedCount += talukasResult.deletedCount || 0;

      // Delete the district
      const districtResult = await MasterItemModel.deleteOne({
        type: "district",
        name: name,
      });
      deletedCount += districtResult.deletedCount || 0;

      return NextResponse.json({
        success: true,
        message: `District "${name}" and all its talukas and villages deleted successfully`,
        deletedCount,
      });
    } else if (type === "taluka") {
      // Delete taluka and all its villages

      // Delete all villages in this taluka
      const villagesResult = await MasterItemModel.deleteMany({
        type: "village",
        parent: name,
      });
      deletedCount += villagesResult.deletedCount || 0;

      // Delete the taluka
      const talukaResult = await MasterItemModel.deleteOne({
        type: "taluka",
        name: name,
      });
      deletedCount += talukaResult.deletedCount || 0;

      return NextResponse.json({
        success: true,
        message: `Taluka "${name}" and all its villages deleted successfully`,
        deletedCount,
      });
    } else if (type === "village") {
      // Delete only the village
      const villageResult = await MasterItemModel.deleteOne({
        type: "village",
        name: name,
      });
      deletedCount += villageResult.deletedCount || 0;

      return NextResponse.json({
        success: true,
        message: `Village "${name}" deleted successfully`,
        deletedCount,
      });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  } catch (error: any) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
