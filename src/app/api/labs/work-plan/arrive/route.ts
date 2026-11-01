import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import { istDayStart } from "@/lib/work-plan";
import AttendanceModel from "@/models/Attendance";
import ExpenseModel from "@/models/Expense";

/** Mark arrival at the outstation destination, with the position and travel time. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  const date = istDateKey();
  const attendance = await AttendanceModel.findOne({ employeeId: employee.employeeId, date }).lean();
  if (!attendance?.punchIn?.at || attendance.punchOut?.at) {
    return NextResponse.json({ error: "You are not on duty" }, { status: 409 });
  }

  const expense = await ExpenseModel.findOne({
    employeeId: employee.employeeId,
    expenseDate: istDayStart(date),
  });
  if (!expense || expense.workPlan !== "outstation") {
    return NextResponse.json({ error: "No outstation route planned for today" }, { status: 409 });
  }
  if (expense.arrivalStatus === "arrived") {
    return NextResponse.json({ error: "You have already marked arrival" }, { status: 409 });
  }

  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const now = new Date();
  expense.arrivalStatus = "arrived";
  expense.arrivedAt = now;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    expense.arrivalLocation = { lat, lng };
  }
  expense.travelTimeMinutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(attendance.punchIn.at).getTime()) / 60000)
  );
  await expense.save();

  return NextResponse.json({ workPlan: expense.toObject() });
}
