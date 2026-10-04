import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import AttendanceModel from "@/models/Attendance";
import EmployeeModel from "@/models/Employee";
import ExpenseModel from "@/models/Expense";
import HolidayModel from "@/models/Holiday";
import LeaveModel from "@/models/Leave";
import ReminderModel from "@/models/Reminder";
import VisitModel from "@/models/Visit";

/** Everything the app's home screen needs, in one round trip. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const today = istDateKey();
  const monthStart = `${today.slice(0, 8)}01`;
  const owner = { employeeName: employee.name };

  const [profile, attendance, visitsToday, visitsMonth, presentDays, pendingLeaves, pendingExpenses, openReminders, nextHoliday] =
    await Promise.all([
      EmployeeModel.findById(employee.employeeId)
        .select("code name email contactNo designation division zone city state reportingTo dateOfJoin appUsername")
        .lean(),
      AttendanceModel.findOne({ employeeId: employee.employeeId, date: today }).lean(),
      VisitModel.countDocuments({ ...owner, visitDate: today }),
      VisitModel.countDocuments({ ...owner, visitDate: { $gte: monthStart } }),
      AttendanceModel.countDocuments({ employeeId: employee.employeeId, date: { $gte: monthStart } }),
      LeaveModel.countDocuments({ ...owner, status: "pending" }),
      ExpenseModel.countDocuments({ ...owner, status: "pending" }),
      ReminderModel.countDocuments({ assignedTo: employee.name, status: "open" }),
      HolidayModel.findOne({
        calendarType: "holiday",
        date: { $gte: today },
        $or: [{ zone: employee.zone }, { zone: "" }, { zone: { $exists: false } }],
      })
        .sort({ date: 1 })
        .lean(),
    ]);

  return NextResponse.json({
    profile,
    today,
    attendance,
    stats: {
      visitsToday,
      visitsMonth,
      presentDays,
      pendingLeaves,
      pendingExpenses,
      openReminders,
    },
    nextHoliday,
  });
}
