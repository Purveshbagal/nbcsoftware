import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import LeaveRequestModel from "@/models/LeaveRequest";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const requests = await LeaveRequestModel.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ items: requests });
}
