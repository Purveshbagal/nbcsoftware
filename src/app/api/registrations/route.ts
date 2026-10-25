import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeRegistration } from "@/lib/serialize-registration";
import { getNextSequence } from "@/models/Counter";
import DoctorModel from "@/models/Doctor";
import RegistrationModel from "@/models/Registration";
import { generateDoctorUinId } from "@/utils/doctorUinGenerator";

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

  let allRegistrations = registrations.map(serializeRegistration);

  // If fetching approved registrations, also include approved doctors from DoctorModel
  // (doctors added via mobile-labs/racer app)
  if (status === "approved") {
    const approvedDoctors = await DoctorModel.find({
      approvalStatus: "approved",
      isActive: { $ne: false },
      source: { $in: ["racer", "survey"] },
    })
      .select("uinId name hospitalName hospitalAddress contactNo email qualification")
      .sort({ name: 1 })
      .lean();

    // Convert Doctor records to Registration format
    const doctorRegistrations = approvedDoctors.map((doc: any) => ({
      _id: doc._id.toString(),
      doctorId: doc.uinId || "",
      doctorName: doc.name || "",
      doctorAddress: "",
      doctorQualification: doc.qualification || "",
      registrationNumber: "",
      mobileNumber: doc.contactNo || "",
      hospitalName: doc.hospitalName || "",
      hospitalAddress: doc.hospitalAddress || "",
      doctorPanNumber: "",
      bankDetails: {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
      },
      status: "approved" as const,
      createdAt: doc.createdAt || new Date().toISOString(),
    }));

    // Merge both lists, avoiding duplicates by doctorId
    const existingDoctorIds = new Set(allRegistrations.map((r) => r.doctorId));
    const newDoctors = doctorRegistrations.filter((d) => !existingDoctorIds.has(d.doctorId));
    allRegistrations = [...allRegistrations, ...newDoctors];
  }

  return NextResponse.json({
    registrations: allRegistrations,
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

  // Generate unified doctor UIN that checks across ALL doctor records (Doctor model + Registration model)
  // This ensures no duplicate IDs between mobile labs and survey apps
  const doctorId = await generateDoctorUinId({ source: "survey" });

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
