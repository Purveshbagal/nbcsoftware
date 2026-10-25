import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import DoctorSpecialityModel from "@/models/DoctorSpeciality";

// GET all specialities for mobile apps
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) {
    return auth.error;
  }

  await connectToDatabase();
  const specialities = await DoctorSpecialityModel.find({ isActive: true })
    .sort({ name: 1 })
    .select("name")
    .lean();

  return NextResponse.json({ specialities: specialities.map((s) => s.name) });
}
