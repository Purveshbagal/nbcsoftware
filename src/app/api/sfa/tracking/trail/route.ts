import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { istDateKey, trailDistanceKm } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AttendanceModel from "@/models/Attendance";
import EmployeeModel from "@/models/Employee";
import LocationPingModel from "@/models/LocationPing";
import VisitModel from "@/models/Visit";

/**
 * One employee's day: the GPS trail, the visits they logged with where they
 * logged them, and punch-in/out. `?employeeId=…&date=YYYY-MM-DD`.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const employeeId = url.searchParams.get("employeeId") ?? "";
  const dateParam = url.searchParams.get("date") ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : istDateKey();

  if (!isValidObjectId(employeeId)) {
    return NextResponse.json({ error: "Choose an employee" }, { status: 400 });
  }

  await connectToDatabase();
  const employee = await EmployeeModel.findById(employeeId).select("name").lean<{ name: string }>();
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const [pings, visits, attendance] = await Promise.all([
    LocationPingModel.find({ employeeId, date })
      .sort({ at: 1 })
      .select("at lat lng accuracy speed battery -_id")
      .lean<{ at: Date; lat: number; lng: number; accuracy?: number; speed?: number; battery?: number }[]>(),
    VisitModel.find({ employeeName: employee.name, visitDate: date })
      .select("visitType doctor firm status callObjective geo checkInAt checkOutAt pobValue")
      .sort({ checkInAt: 1 })
      .lean(),
    AttendanceModel.findOne({ employeeId, date }).lean(),
  ]);

  return NextResponse.json({
    date,
    employee: { id: employeeId, name: employee.name },
    points: pings,
    distanceKm: trailDistanceKm(pings),
    visits,
    attendance,
  });
}
