import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import { readJsonBody } from "@/lib/read-json";
import LeaveRequestModel from "@/models/LeaveRequest";
import AttendanceModel from "@/models/Attendance";
import PaidLeaveBalanceModel from "@/models/PaidLeaveBalance";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await readJsonBody(request);
  const { status, reviewRemarks } = body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectToDatabase();

  const leaveReq = await LeaveRequestModel.findById(id);
  if (!leaveReq) {
    return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
  }

  if (leaveReq.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  leaveReq.status = status;
  leaveReq.reviewedBy = { username: auth.session!.username, name: auth.session!.name };
  leaveReq.reviewedAt = new Date();
  leaveReq.reviewRemarks = reviewRemarks || "";

  if (status === "approved") {
    const from = new Date(leaveReq.fromDate);
    const to = new Date(leaveReq.toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const attendanceStatus = leaveReq.leaveType === "paid_leave" ? "present" : "absent";

    // Create attendance records
    for (let i = 0; i < days; i++) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);

      await AttendanceModel.findOneAndUpdate(
        { employeeId: leaveReq.employeeId, date: dateStr },
        {
          employeeName: leaveReq.employeeName,
          date: dateStr,
          status: attendanceStatus,
          punchIn: { note: `Leave: ${leaveReq.reason}` },
        },
        { upsert: true }
      );
    }

    // Update paid leave balance
    if (leaveReq.leaveType === "paid_leave") {
      const year = new Date().getFullYear();
      await PaidLeaveBalanceModel.findOneAndUpdate(
        { employeeId: leaveReq.employeeId, year },
        {
          $inc: { used: days, remaining: -days },
          employeeCode: leaveReq.employeeCode,
          employeeName: leaveReq.employeeName,
        },
        { upsert: true }
      );
    }
  }

  await leaveReq.save();

  return NextResponse.json({ item: leaveReq });
}
