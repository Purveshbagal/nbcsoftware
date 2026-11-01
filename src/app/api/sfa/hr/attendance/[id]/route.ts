import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AttendanceModel from "@/models/Attendance";
import LeaveRequestModel from "@/models/LeaveRequest";

// GET - Fetch day-wise attendance details for a single employee
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id: employeeId } = await params;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
  }

  await connectToDatabase();

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Get all attendance records for this month
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum - 1, daysInMonth, 23, 59, 59);

  const attendanceRecords = await AttendanceModel.find({
    employeeId,
    punchInTime: { $gte: startDate, $lte: endDate },
  })
    .sort({ punchInTime: 1 })
    .lean();

  // Get approved leaves for this month
  const approvedLeaves = await LeaveRequestModel.find({
    employeeId,
    status: "approved",
  }).lean();

  // Create a map of dates with attendance/leave info
  const dateMap = new Map<string, any>();

  // Add attendance records
  for (const record of attendanceRecords) {
    const punchIn = new Date(record.punchInTime);
    const dateKey = punchIn.toISOString().slice(0, 10); // YYYY-MM-DD

    const punchOut = record.punchOutTime ? new Date(record.punchOutTime) : null;
    const minutes = punchOut
      ? Math.floor((punchOut.getTime() - punchIn.getTime()) / (1000 * 60))
      : 0;

    dateMap.set(dateKey, {
      date: dateKey,
      status: minutes >= 120 ? "present" : "absent",
      punchIn: record.punchInTime,
      punchOut: record.punchOutTime || null,
      workingMinutes: minutes,
      reason: minutes < 120 ? "Less than 2 hours worked" : null,
    });
  }

  // Add paid leave days
  for (const leave of approvedLeaves) {
    if (leave.leaveType !== "paid_leave") continue;

    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);

    // Check if leave falls in this month
    if (
      (from >= startDate && from <= endDate) ||
      (to >= startDate && to <= endDate) ||
      (from < startDate && to > endDate)
    ) {
      const leaveStart = from < startDate ? startDate : from;
      const leaveEnd = to > endDate ? endDate : to;

      // Mark each day as paid leave
      let current = new Date(leaveStart);
      while (current <= leaveEnd) {
        const dateKey = current.toISOString().slice(0, 10);

        // Only mark if not already present
        if (!dateMap.has(dateKey) || dateMap.get(dateKey).status !== "present") {
          dateMap.set(dateKey, {
            date: dateKey,
            status: "paid_leave",
            punchIn: null,
            punchOut: null,
            workingMinutes: 0,
            reason: leave.reason || "Paid Leave",
            leaveType: leave.leaveType,
          });
        }

        current.setDate(current.getDate() + 1);
      }
    }
  }

  // Add regular leave days (unpaid)
  for (const leave of approvedLeaves) {
    if (leave.leaveType !== "leave") continue;

    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);

    if (
      (from >= startDate && from <= endDate) ||
      (to >= startDate && to <= endDate) ||
      (from < startDate && to > endDate)
    ) {
      const leaveStart = from < startDate ? startDate : from;
      const leaveEnd = to > endDate ? endDate : to;

      let current = new Date(leaveStart);
      while (current <= leaveEnd) {
        const dateKey = current.toISOString().slice(0, 10);

        if (!dateMap.has(dateKey) || dateMap.get(dateKey).status === "absent") {
          dateMap.set(dateKey, {
            date: dateKey,
            status: "absent",
            punchIn: null,
            punchOut: null,
            workingMinutes: 0,
            reason: leave.reason || "Leave",
            leaveType: leave.leaveType,
          });
        }

        current.setDate(current.getDate() + 1);
      }
    }
  }

  // Create day-wise array for all days in month
  const details = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dateKey = date.toISOString().slice(0, 10);

    if (dateMap.has(dateKey)) {
      details.push(dateMap.get(dateKey));
    } else {
      // Absent (no punch in, no leave)
      details.push({
        date: dateKey,
        status: "absent",
        punchIn: null,
        punchOut: null,
        workingMinutes: 0,
        reason: "No attendance record",
      });
    }
  }

  return NextResponse.json({ details, month });
}
