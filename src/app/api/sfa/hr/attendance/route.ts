import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import EmployeeModel from "@/models/Employee";
import AttendanceModel from "@/models/Attendance";
import LeaveRequestModel from "@/models/LeaveRequest";
import HolidaySettingModel from "@/models/HolidaySetting";

// GET - Fetch attendance summary for all employees for a month
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
  }

  await connectToDatabase();

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Get holiday settings
  const holidaySettings = await HolidaySettingModel.findOne();
  const sundayIsWorkingDay = holidaySettings?.sundayIsWorkingDay || false;
  const enabledHolidays = (holidaySettings?.holidays || [])
    .filter((h: any) => h.enabled)
    .map((h: any) => h.date);

  // Count holiday days in this month
  function isHoliday(date: Date): boolean {
    const dateStr = date.toISOString().slice(0, 10);

    // Check if it's a Sunday and Sunday is not a working day
    if (!sundayIsWorkingDay && date.getDay() === 0) {
      return true;
    }

    // Check if it's in the enabled holidays list
    return enabledHolidays.includes(dateStr);
  }

  // Count total holiday days in month
  let holidayDaysInMonth = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    if (isHoliday(date)) {
      holidayDaysInMonth++;
    }
  }

  // Get all active employees
  const employees = await EmployeeModel.find({ isActive: { $ne: false } })
    .select("_id code name designation")
    .sort({ code: 1 })
    .lean();

  const attendance = [];

  for (const employee of employees) {
    // Count attendance
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum - 1, daysInMonth, 23, 59, 59);

    // Get all attendance records for this month (punch in >= 2 hours)
    const attendanceRecords = await AttendanceModel.find({
      employeeId: employee._id,
      punchInTime: { $gte: startDate, $lte: endDate },
    }).lean();

    // Count present days (working minutes >= 120)
    let presentDays = 0;
    for (const record of attendanceRecords) {
      const punchIn = new Date(record.punchInTime);
      const punchOut = record.punchOutTime ? new Date(record.punchOutTime) : new Date();
      const minutes = Math.floor((punchOut.getTime() - punchIn.getTime()) / (1000 * 60));
      if (minutes >= 120) {
        presentDays++;
      }
    }

    // Get approved paid leave days for this month
    const approvedLeaves = await LeaveRequestModel.find({
      employeeId: employee._id,
      status: "approved",
      leaveType: "paid_leave",
    }).lean();

    let paidLeaveDays = 0;
    for (const leave of approvedLeaves) {
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);

      // Check if leave falls in this month
      if (
        (from >= startDate && from <= endDate) ||
        (to >= startDate && to <= endDate) ||
        (from < startDate && to > endDate)
      ) {
        // Count days in this month only
        const leaveStart = from < startDate ? startDate : from;
        const leaveEnd = to > endDate ? endDate : to;
        const days = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        paidLeaveDays += days;
      }
    }

    // Holidays are auto-present, so add them to present days
    const holidayPresent = holidayDaysInMonth;
    const totalPresent = presentDays + holidayPresent;

    // Calculate absent days (excluding holidays and paid leaves)
    const absentDays = daysInMonth - totalPresent - paidLeaveDays;

    attendance.push({
      employeeId: employee._id.toString(),
      employeeCode: employee.code,
      employeeName: employee.name,
      designation: employee.designation || "",
      totalDays: daysInMonth,
      presentDays: totalPresent,
      absentDays: Math.max(0, absentDays),
      paidLeaveDays,
    });
  }

  return NextResponse.json({ attendance, month, daysInMonth });
}
