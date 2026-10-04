import { NextResponse } from "next/server";

import { istDateKey, requireEmployee, trailDistanceKm } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import AttendanceModel from "@/models/Attendance";
import EmployeeModel from "@/models/Employee";
import LocationPingModel from "@/models/LocationPing";

/** Under four hours on duty counts as a half day. */
const FULL_DAY_MINUTES = 4 * 60;

/** End the working day and work out hours and distance. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  const date = istDateKey();
  const attendance = await AttendanceModel.findOne({ employeeId: employee.employeeId, date });

  if (!attendance?.punchIn?.at) {
    return NextResponse.json({ error: "You have not punched in today" }, { status: 409 });
  }
  if (attendance.punchOut?.at) {
    return NextResponse.json({ error: "You have already punched out today" }, { status: 409 });
  }

  const now = new Date();
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const accuracy = Number(body?.accuracy);
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  const pings = await LocationPingModel.find({ employeeId: employee.employeeId, date })
    .sort({ at: 1 })
    .select("lat lng accuracy")
    .lean<{ lat: number; lng: number; accuracy?: number }[]>();

  const trail = [
    { lat: attendance.punchIn.lat!, lng: attendance.punchIn.lng!, accuracy: attendance.punchIn.accuracy },
    ...pings,
    ...(hasPoint ? [{ lat, lng, accuracy }] : []),
  ].filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const workingMinutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(attendance.punchIn.at).getTime()) / 60000)
  );

  attendance.set({
    punchOut: {
      at: now,
      ...(hasPoint ? { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : undefined } : {}),
      note: String(body?.note ?? "").trim(),
    },
    workingMinutes,
    distanceKm: trailDistanceKm(trail),
    status: workingMinutes < FULL_DAY_MINUTES ? "half-day" : "present",
  });
  await attendance.save();

  await EmployeeModel.updateOne(
    { _id: employee.employeeId },
    {
      lastSeenAt: now,
      ...(hasPoint ? { lastLocation: { lat, lng, accuracy, at: now } } : {}),
    }
  );

  return NextResponse.json({ item: attendance.toObject() });
}
