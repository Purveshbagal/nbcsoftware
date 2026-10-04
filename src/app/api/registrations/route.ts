import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeRegistration } from "@/lib/serialize-registration";
import { getNextSequence } from "@/models/Counter";
import RegistrationModel from "@/models/Registration";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const query: Record<string, unknown> = status ? { status } : {};
  if (session.role !== "admin") {
    query["requestedBy.username"] = session.username;
  }

  const registrations = await RegistrationModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    registrations: registrations.map(serializeRegistration),
  });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  } = await request.json();

  if (!doctorName || !registrationNumber) {
    return NextResponse.json(
      { error: "Doctor name and registration number are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const seq = await getNextSequence("doctorId");
  const doctorId = `DOC-${String(seq).padStart(4, "0")}`;

  const registration = await RegistrationModel.create({
    doctorId,
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
    status: "pending",
    requestedBy: {
      username: session.username,
      name: session.name,
    },
  });

  return NextResponse.json(
    { registration: serializeRegistration(registration.toObject()) },
    { status: 201 }
  );
}
