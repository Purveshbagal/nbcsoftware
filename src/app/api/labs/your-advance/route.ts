import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import AdvancedPaymentModel from "@/models/AdvancedPayment";

/**
 * GET /api/labs/your-advance
 * Get employee's active advance details
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  // Get active advance (paid but not fully deducted)
  const activeAdvance = await AdvancedPaymentModel.findOne({
    employeeId: auth.employee.employeeId,
    status: "active",
  })
    .sort({ givenDate: -1 })
    .lean();

  if (!activeAdvance) {
    return NextResponse.json({ advance: null });
  }

  return NextResponse.json({
    advance: {
      _id: activeAdvance._id?.toString(),
      advanceAmount: activeAdvance.advanceAmount,
      paymentType: activeAdvance.paymentType,
      installmentAmount: activeAdvance.installmentAmount,
      totalDeducted: activeAdvance.totalDeducted,
      remainingAmount: activeAdvance.remainingAmount,
      givenDate: activeAdvance.givenDate,
      deductFromMonth: activeAdvance.deductFromMonth,
      installmentFromMonth: activeAdvance.installmentFromMonth,
      installments: activeAdvance.installments?.map((inst) => ({
        month: inst.month,
        amount: inst.amount,
        status: inst.status,
        deductedOn: inst.deductedOn,
      })),
    },
  });
}
