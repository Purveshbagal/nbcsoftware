import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AttendanceModel from "@/models/Attendance";
import AdvancedPaymentModel from "@/models/AdvancedPayment";
import LeaveModel from "@/models/Leave";

/**
 * Get detailed pending salary breakdown for a specific employee and month
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id: employeeId } = await params;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "Month parameter required" }, { status: 400 });
  }

  await connectToDatabase();

  // Get attendance details
  const attendance = await AttendanceModel.find({
    employeeId,
    date: { $regex: `^${month}` }
  })
    .sort({ date: 1 })
    .lean();

  const attendanceDetails = attendance.map(a => ({
    date: a.date,
    status: a.status,
    punchIn: a.punchIn?.at,
    punchOut: a.punchOut?.at,
    workingMinutes: a.workingMinutes || 0,
  }));

  // Get absence reasons from leave requests
  const leaves = await LeaveModel.find({
    employeeId,
    status: "approved",
    $or: [
      { fromDate: { $regex: `^${month}` } },
      { toDate: { $regex: `^${month}` } }
    ]
  })
    .sort({ fromDate: 1 })
    .lean();

  const leaveDetails = leaves.map(l => ({
    _id: l._id,
    fromDate: l.fromDate,
    toDate: l.toDate,
    days: l.days,
    reason: l.reason,
    leaveType: l.leaveType,
  }));

  // Get advance installment details for this month
  const advance = await AdvancedPaymentModel.findOne({
    employeeId,
    status: "active"
  }).lean();

  let advanceDetails = null;
  if (advance) {
    if (advance.paymentType === "one_time") {
      if (advance.deductFromMonth === month) {
        advanceDetails = {
          type: "one_time",
          amount: advance.advanceAmount,
          givenDate: advance.givenDate,
          remainingAmount: advance.remainingAmount,
        };
      }
    } else if (advance.paymentType === "installment") {
      const installment = advance.installments?.find(
        (inst: any) => inst.month === month
      );
      if (installment) {
        advanceDetails = {
          type: "installment",
          installmentNumber: advance.installments?.indexOf(installment)! + 1,
          totalInstallments: advance.installments?.length,
          amount: installment.amount,
          status: installment.status,
          givenDate: advance.givenDate,
          totalAdvance: advance.advanceAmount,
          totalDeducted: advance.totalDeducted,
          remainingAmount: advance.remainingAmount,
        };
      }
    }
  }

  return NextResponse.json({
    attendance: attendanceDetails,
    leaves: leaveDetails,
    advance: advanceDetails,
  });
}
