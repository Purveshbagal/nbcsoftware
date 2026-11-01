import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeSalaryModel from "@/models/EmployeeSalary";
import SalaryPaymentModel from "@/models/SalaryPayment";

/**
 * GET /api/labs/your-salary
 * Get employee's salary details and payment history
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  // Get base salary
  const salaryDoc = await EmployeeSalaryModel.findOne({
    employeeId: auth.employee.employeeId,
  }).lean();

  const baseSalary = salaryDoc?.salaryAmount || 0;

  // Get salary payments (last 6 months)
  const payments = await SalaryPaymentModel.find({
    employeeId: auth.employee.employeeId,
  })
    .sort({ month: -1 })
    .limit(6)
    .lean();

  return NextResponse.json({
    baseSalary,
    effectiveFrom: salaryDoc?.effectiveFrom,
    payments: payments.map((pay) => ({
      month: pay.month,
      salaryAmount: pay.salaryAmount,
      presentDays: pay.presentDays,
      absentDays: pay.absentDays,
      paidLeaveDays: pay.paidLeaveDays,
      totalWorkingDays: pay.totalWorkingDays,
      absentDeduction: pay.absentDeduction,
      advanceDeduction: pay.advanceDeduction,
      netPayable: pay.netPayable,
      paidAmount: pay.paidAmount,
      paymentDate: pay.paymentDate,
      paymentMode: pay.paymentMode,
      remarks: pay.remarks,
    })),
  });
}
