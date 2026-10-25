import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import DoctorQualificationModel from "@/models/DoctorQualification";

// GET all qualifications for mobile apps
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) {
    return auth.error;
  }

  await connectToDatabase();
  const qualifications = await DoctorQualificationModel.find({ isActive: true })
    .sort({ name: 1 })
    .select("name")
    .lean();

  return NextResponse.json({ qualifications: qualifications.map((q) => q.name) });
}
