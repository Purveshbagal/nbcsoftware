import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import EmployeeModel from "@/models/Employee";
import AttendanceModel from "@/models/Attendance";

// GET - Fetch employee performance data
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";
  const customFrom = searchParams.get("from");
  const customTo = searchParams.get("to");

  await connectToDatabase();

  // Calculate date range based on filter
  let startDate: Date;
  let endDate: Date;
  const now = new Date();

  switch (filter) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "custom":
      if (!customFrom || !customTo) {
        return NextResponse.json({ error: "Custom date range requires from and to dates" }, { status: 400 });
      }
      startDate = new Date(customFrom);
      endDate = new Date(customTo);
      endDate.setHours(23, 59, 59);
      break;
    default:
      return NextResponse.json({ error: "Invalid filter" }, { status: 400 });
  }

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Get all active employees
  const employees = await EmployeeModel.find({ isActive: true })
    .select("_id code name designation")
    .sort({ code: 1 })
    .lean();

  const performance = [];

  for (const employee of employees) {
    // Get attendance records for this period
    const attendanceRecords = await AttendanceModel.find({
      employeeId: employee._id,
      punchInTime: { $gte: startDate, $lte: endDate },
    }).lean();

    // Count present days (working >= 2 hours)
    let presentDays = 0;
    for (const record of attendanceRecords) {
      const punchIn = new Date(record.punchInTime);
      const punchOut = record.punchOutTime ? new Date(record.punchOutTime) : new Date();
      const minutes = Math.floor((punchOut.getTime() - punchIn.getTime()) / (1000 * 60));
      if (minutes >= 120) {
        presentDays++;
      }
    }

    // Calculate work plan completion (placeholder - integrate with your work plan system)
    const workPlanTotal = totalDays * 5; // Assume 5 tasks per day
    const workPlanCompleted = Math.floor(Math.random() * workPlanTotal); // Replace with actual data

    // Determine today's status
    let todayStatus: "working" | "idle" | "offline" = "offline";
    if (filter === "today" || filter === "yesterday") {
      const todayAttendance = attendanceRecords[attendanceRecords.length - 1];
      if (todayAttendance) {
        const lastPunch = new Date(todayAttendance.punchInTime);
        const hoursSinceLastPunch = (now.getTime() - lastPunch.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastPunch < 1) {
          todayStatus = "working";
        } else if (hoursSinceLastPunch < 8) {
          todayStatus = "idle";
        }
      }
    }

    // Calculate performance score
    const attendanceScore = (presentDays / totalDays) * 50;
    const workPlanScore = (workPlanCompleted / workPlanTotal) * 50;
    const performanceScore = Math.min(100, Math.round(attendanceScore + workPlanScore));

    // Determine trend (placeholder - compare with previous period)
    const performanceTrend = performanceScore >= 70 ? "up" : performanceScore >= 40 ? "stable" : "down";

    performance.push({
      employeeId: employee._id.toString(),
      employeeCode: employee.code,
      employeeName: employee.name,
      designation: employee.designation || "",
      totalWorkDays: totalDays,
      presentDays,
      workPlanCompleted,
      workPlanTotal,
      todayStatus,
      performanceTrend,
      performanceScore,
    });
  }

  return NextResponse.json({
    performance,
    filter,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
}
