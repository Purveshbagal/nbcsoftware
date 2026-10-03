import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeRegistration } from "@/lib/serialize-registration";
import RegistrationModel from "@/models/Registration";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;

  await connectToDatabase();

  if (body.status !== undefined) {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const registration = await RegistrationModel.findByIdAndUpdate(
      id,
      {
        status: body.status,
        reviewedBy: { username: session.username, name: session.name },
        reviewedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registration: serializeRegistration(registration),
    });
  }

  const existing = await RegistrationModel.findById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }

  const isOwner = existing.requestedBy?.username === session.username;
  if (session.role !== "admin") {
    if (!isOwner || existing.status !== "pending") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const {
    doctorName,
    doctorAddress,
    doctorQualification,
    registrationNumber,
    mobileNumber,
    hospitalName,
    hospitalAddress,
    doctorPanNumber,
    bankDetails,
  } = body;

  if (!doctorName || !registrationNumber) {
    return NextResponse.json(
      { error: "Doctor name and registration number are required" },
      { status: 400 }
    );
  }

  const registration = await RegistrationModel.findByIdAndUpdate(
    id,
    {
      doctorName,
      doctorAddress,
      doctorQualification,
      registrationNumber,
      mobileNumber,
      hospitalName,
      hospitalAddress,
      doctorPanNumber,
      bankDetails: {
        bankName: bankDetails?.bankName,
        accountNumber: bankDetails?.accountNumber,
        ifscCode: bankDetails?.ifscCode,
        branchName: bankDetails?.branchName,
      },
    },
    { new: true }
  ).lean();

  return NextResponse.json({
    registration: registration && serializeRegistration(registration),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await connectToDatabase();

  const registration = await RegistrationModel.findByIdAndDelete(id);

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
