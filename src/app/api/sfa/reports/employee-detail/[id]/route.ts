import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AttendanceModel from "@/models/Attendance";

// GET - Fetch employee detail report (work plan, route, updates)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id: employeeId } = await params;
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";

  await connectToDatabase();

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

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
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  // Get attendance records
  const attendanceRecords = await AttendanceModel.find({
    employeeId,
    punchInTime: { $gte: startDate, $lte: endDate },
  })
    .sort({ punchInTime: 1 })
    .lean();

  // Build work plan (placeholder - integrate with your work planning system)
  const workPlan = [
    {
      time: "09:00 AM",
      activity: "Visit Doctor - Dr. Sharma",
      location: "Apollo Clinic, Pune",
      status: attendanceRecords.length > 0 ? "completed" : "pending",
    },
    {
      time: "11:00 AM",
      activity: "Visit Pharmacy - MedPlus",
      location: "FC Road, Pune",
      status: attendanceRecords.length > 1 ? "completed" : attendanceRecords.length > 0 ? "in_progress" : "pending",
    },
    {
      time: "02:00 PM",
      activity: "Visit Hospital - Ruby Hall",
      location: "Ruby Hall Clinic, Pune",
      status: attendanceRecords.length > 2 ? "completed" : "pending",
    },
    {
      time: "04:00 PM",
      activity: "Visit Doctor - Dr. Patel",
      location: "Aundh, Pune",
      status: "pending",
    },
  ];

  // Build daily updates from attendance
  const dailyUpdates = attendanceRecords.map((record) => {
    const punchIn = new Date(record.punchInTime);
    return {
      time: punchIn.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      activity: "Punch In",
      location: record.location || "Unknown",
      notes: record.punchOutTime
        ? `Checked out at ${new Date(record.punchOutTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Still active",
    };
  });

  // Build route info (placeholder)
  const routeInfo = attendanceRecords.length > 0
    ? {
        startLocation: attendanceRecords[0]?.location || "Office - Pune",
        currentLocation: attendanceRecords[attendanceRecords.length - 1]?.location || "Office - Pune",
        plannedStops: 4,
        completedStops: attendanceRecords.length,
        distance: "45 km",
      }
    : {
        startLocation: "Office - Pune",
        currentLocation: "Office - Pune",
        plannedStops: 4,
        completedStops: 0,
        distance: "0 km",
      };

  return NextResponse.json({
    workPlan,
    dailyUpdates,
    routeInfo,
    filter,
  });
}
