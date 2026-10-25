import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import DoctorQualificationModel from "@/models/DoctorQualification";

// GET all qualifications
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const qualifications = await DoctorQualificationModel.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ qualifications });
}

// POST create new qualification (admin only)
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as { name?: string; description?: string } | null;

  if (!body?.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectToDatabase();

  // Check if already exists
  const existing = await DoctorQualificationModel.findOne({
    name: { $regex: new RegExp(`^${body.name}$`, "i") },
  });

  if (existing) {
    return NextResponse.json({ error: "Qualification already exists" }, { status: 400 });
  }

  const qualification = await DoctorQualificationModel.create({
    name: body.name,
    description: body.description || "",
    createdBy: { username: session.username, name: session.name },
  });

  return NextResponse.json({ qualification });
}

// DELETE qualification (admin only)
export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await connectToDatabase();

  await DoctorQualificationModel.findByIdAndUpdate(id, { isActive: false });

  return NextResponse.json({ ok: true });
}
