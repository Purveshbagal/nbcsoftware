import { NextResponse } from "next/server";

import { referenceNumber } from "@/lib/labs-crud";
import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import DoctorModel from "@/models/Doctor";
import VisitModel from "@/models/Visit";

/**
 * Plan a new visit
 * User selects doctor, date, and mode of transport
 */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = (await readJsonBody(request)) as
    | {
        doctorId?: string;
        doctorName?: string;
        plannedDate?: string;
        modeOfTransport?: string;
      }
    | null;

  if (!body?.doctorName) {
    return NextResponse.json({ error: "Doctor name is required" }, { status: 400 });
  }

  if (!body?.plannedDate) {
    return NextResponse.json({ error: "Planned date is required" }, { status: 400 });
  }

  const modeOfTransport = ["Bike", "Car", "Public Transport"].includes(body.modeOfTransport || "")
    ? body.modeOfTransport
    : "";

  // Fetch doctor details if doctorId provided
  let doctorDetails = null;
  if (body.doctorId) {
    doctorDetails = await DoctorModel.findById(body.doctorId).lean();
  }

  const visit = await VisitModel.create({
    visitCode: referenceNumber("VS"),
    visitType: "doctor",
    doctor: body.doctorName,
    clinicAddress: doctorDetails?.clinicAddress || "",
    city: doctorDetails?.city || "",
    zone: employee.zone,
    division: employee.division,
    employeeName: employee.name,
    employeeId: employee.employeeId,
    plannedDate: body.plannedDate,
    visitDate: istDateKey(new Date()), // Actual visit date set when checked in
    modeOfTransport,
    status: "planned",
    source: "app",
    createdBy: { username: employee.username, name: employee.name },
    // Store doctor location for directions
    geo: doctorDetails?.location?.latitude
      ? {
          lat: doctorDetails.location.latitude,
          lng: doctorDetails.location.longitude,
        }
      : undefined,
  });

  return NextResponse.json({ visit }, { status: 201 });
}
