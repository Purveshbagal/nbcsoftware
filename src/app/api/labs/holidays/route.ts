import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import HolidayModel from "@/models/Holiday";

/**
 * Holidays for the employee's zone (or for every zone), plus any work-calendar
 * days set for them personally, for the given year.
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const param = new URL(request.url).searchParams.get("year");
  const year = param && /^\d{4}$/.test(param) ? param : istDateKey().slice(0, 4);

  const items = await HolidayModel.find({
    date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    $or: [
      { calendarType: { $in: ["holiday", "restricted"] }, zone: { $in: [employee.zone, "", null] } },
      { calendarType: "work", employeeName: employee.name },
    ],
  })
    .sort({ date: 1 })
    .lean();

  return NextResponse.json({ year, items });
}
