import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import DoctorModel from "@/models/Doctor";

/**
 * Get approved doctors for Survey mobile app
 * Only shows doctors that were added from Racer app and approved by admin
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim();
  const searchByUin = searchParams.get("uin")?.trim();

  const query: Record<string, unknown> = {
    source: "racer",
    approvalStatus: "approved",
    isActive: { $ne: false },
  };

  // Search by UIN ID
  if (searchByUin) {
    query.uinId = { $regex: searchByUin, $options: "i" };
  }
  // Search by name, hospital, or city
  else if (search) {
    const pattern = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    query.$or = [{ name: pattern }, { hospitalName: pattern }, { city: pattern }];
  }

  const doctors = await DoctorModel.find(query)
    .select(
      "uinId name hospitalName hospitalAddress contactNo email qualification speciality category gender bankDetails documents createdAt"
    )
    .sort({ name: 1 })
    .limit(500)
    .lean();

  return NextResponse.json({ doctors });
}
