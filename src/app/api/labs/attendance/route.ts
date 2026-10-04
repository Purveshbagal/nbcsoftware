import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import AttendanceModel from "@/models/Attendance";

/** The employee's attendance for a month (`?month=YYYY-MM`, default current). */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const param = new URL(request.url).searchParams.get("month");
  const month = param && /^\d{4}-\d{2}$/.test(param) ? param : istDateKey().slice(0, 7);

  const items = await AttendanceModel.find({
    employeeId: auth.employee.employeeId,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  })
    .sort({ date: -1 })
    .lean();

  const totalMinutes = items.reduce((sum, row) => sum + (row.workingMinutes ?? 0), 0);

  return NextResponse.json({ month, items, totalMinutes });
}
