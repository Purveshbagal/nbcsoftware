import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import AttendanceModel from "@/models/Attendance";
import EmployeeModel from "@/models/Employee";

function readPoint(body: Record<string, unknown> | null) {
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const accuracy = Number(body?.accuracy);
  return { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : undefined };
}

/** Start the working day. A location is required — that is the point of it. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  const point = readPoint(body);
  if (!point) {
    return NextResponse.json(
      { error: "Your location is needed to punch in. Turn on GPS and try again." },
      { status: 400 }
    );
  }

  const date = istDateKey();
  const existing = await AttendanceModel.findOne({ employeeId: employee.employeeId, date });
  if (existing?.punchIn?.at) {
    return NextResponse.json({ error: "You have already punched in today", item: existing }, { status: 409 });
  }

  const now = new Date();
  const item = await AttendanceModel.findOneAndUpdate(
    { employeeId: employee.employeeId, date },
    {
      $set: {
        employeeName: employee.name,
        zone: employee.zone,
        division: employee.division,
        workAgenda: String(body?.workAgenda ?? "").trim(),
        punchIn: { at: now, ...point, note: String(body?.note ?? "").trim() },
        status: "present",
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  await EmployeeModel.updateOne(
    { _id: employee.employeeId },
    { lastSeenAt: now, lastLocation: { ...point, at: now } }
  );

  return NextResponse.json({ item }, { status: 201 });
}
