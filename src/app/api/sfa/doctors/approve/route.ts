import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import DoctorModel from "@/models/Doctor";

/**
 * Approve or reject doctors added from Racer app
 */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as
    | { doctorId?: string; action?: "approve" | "reject" }
    | null;

  if (!body?.doctorId || !body?.action) {
    return NextResponse.json({ error: "doctorId and action are required" }, { status: 400 });
  }

  if (!["approve", "reject"].includes(body.action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  await connectToDatabase();

  const doctor = await DoctorModel.findById(body.doctorId);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  if (doctor.approvalStatus !== "pending") {
    return NextResponse.json(
      { error: `Doctor already ${doctor.approvalStatus}` },
      { status: 400 }
    );
  }

  doctor.approvalStatus = body.action === "approve" ? "approved" : "rejected";
  doctor.approvedBy = { username: session.username, name: session.name };
  doctor.approvedAt = new Date();

  await doctor.save();

  return NextResponse.json({ doctor });
}

/**
 * Get all pending doctors for approval
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  const doctors = await DoctorModel.find({
    source: "racer",
    approvalStatus: status,
  })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ doctors });
}
