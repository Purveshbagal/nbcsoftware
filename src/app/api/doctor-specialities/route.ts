import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import DoctorSpecialityModel from "@/models/DoctorSpeciality";

// GET all specialities
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const specialities = await DoctorSpecialityModel.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ specialities });
}

// POST create new speciality (admin only)
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
  const existing = await DoctorSpecialityModel.findOne({
    name: { $regex: new RegExp(`^${body.name}$`, "i") },
  });

  if (existing) {
    return NextResponse.json({ error: "Speciality already exists" }, { status: 400 });
  }

  const speciality = await DoctorSpecialityModel.create({
    name: body.name,
    description: body.description || "",
    createdBy: { username: session.username, name: session.name },
  });

  return NextResponse.json({ speciality });
}

// DELETE speciality (admin only)
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

  await DoctorSpecialityModel.findByIdAndUpdate(id, { isActive: false });

  return NextResponse.json({ ok: true });
}
