import { NextResponse } from "next/server";

import { istDateKey, thinTrail } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AttendanceModel from "@/models/Attendance";
import EmployeeModel from "@/models/Employee";
import LocationPingModel from "@/models/LocationPing";
import VisitModel from "@/models/Visit";

export type LiveEmployee = {
  id: string;
  name: string;
  designation: string;
  zone: string;
  lastLocation: { lat: number; lng: number; accuracy?: number; battery?: number; at: string } | null;
  lastSeenAt: string | null;
  punchInAt: string | null;
  punchOutAt: string | null;
  visitsToday: number;
  /** Today's route as `[lat, lng, epochMs]`, thinned for drawing. */
  trail: [number, number, number][];
};

/** Enough to follow the roads at city zoom without shipping every fix. */
const TRAIL_MIN_METERS = 25;

/** Every employee with app access, where they last were, and today's duty state. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();
  const today = istDateKey();

  const employees = await EmployeeModel.find({ appAccessEnabled: true, isActive: { $ne: false } })
    .select("name designation zone lastLocation lastSeenAt")
    .sort({ name: 1 })
    .lean<
      {
        _id: { toString(): string };
        name: string;
        designation?: string;
        zone?: string;
        lastLocation?: { lat?: number; lng?: number; accuracy?: number; battery?: number; at?: Date };
        lastSeenAt?: Date;
      }[]
    >();

  const ids = employees.map((employee) => employee._id);
  const [attendance, visits, pings] = await Promise.all([
    AttendanceModel.find({ employeeId: { $in: ids }, date: today })
      .select("employeeId punchIn.at punchOut.at")
      .lean<{ employeeId: { toString(): string }; punchIn?: { at?: Date }; punchOut?: { at?: Date } }[]>(),
    VisitModel.aggregate<{ _id: string; count: number }>([
      { $match: { visitDate: today, employeeName: { $in: employees.map((e) => e.name) } } },
      { $group: { _id: "$employeeName", count: { $sum: 1 } } },
    ]),
    LocationPingModel.find({ employeeId: { $in: ids }, date: today })
      .sort({ at: 1 })
      .select("employeeId lat lng accuracy at -_id")
      .lean<{ employeeId: { toString(): string }; lat: number; lng: number; accuracy?: number; at: Date }[]>(),
  ]);

  const pingsById = new Map<string, typeof pings>();
  for (const ping of pings) {
    const key = ping.employeeId.toString();
    const list = pingsById.get(key) ?? [];
    list.push(ping);
    pingsById.set(key, list);
  }

  const attendanceById = new Map(attendance.map((row) => [row.employeeId.toString(), row]));
  const visitsByName = new Map(visits.map((row) => [row._id, row.count]));

  const items: LiveEmployee[] = employees.map((employee) => {
    const id = employee._id.toString();
    const location = employee.lastLocation;
    const day = attendanceById.get(id);
    return {
      id,
      name: employee.name,
      designation: employee.designation ?? "",
      zone: employee.zone ?? "",
      lastLocation:
        location?.lat !== undefined && location?.lng !== undefined && location.at
          ? {
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              battery: location.battery,
              at: new Date(location.at).toISOString(),
            }
          : null,
      lastSeenAt: employee.lastSeenAt ? new Date(employee.lastSeenAt).toISOString() : null,
      punchInAt: day?.punchIn?.at ? new Date(day.punchIn.at).toISOString() : null,
      punchOutAt: day?.punchOut?.at ? new Date(day.punchOut.at).toISOString() : null,
      visitsToday: visitsByName.get(employee.name) ?? 0,
      trail: thinTrail(pingsById.get(id) ?? [], TRAIL_MIN_METERS).map((p) => [
        p.lat,
        p.lng,
        new Date(p.at).getTime(),
      ]),
    };
  });

  return NextResponse.json({ today, items });
}
