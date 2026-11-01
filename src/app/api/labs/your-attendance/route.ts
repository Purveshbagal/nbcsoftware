import { NextResponse } from "next/server";

import { requireEmployee, istDateKey } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeAttendanceModel from "@/models/EmployeeAttendance";
import EmployeeSalaryModel from "@/models/EmployeeSalary";
import AdvancedPaymentModel from "@/models/AdvancedPayment";
import PaidLeaveBalanceModel from "@/models/PaidLeaveBalance";

/**
 * GET /api/labs/your-attendance
 * Get employee's monthly attendance with salary calculation
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month"); // YYYY-MM format

  const now = new Date();
  const month = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await connectToDatabase();

  // Get employee's base salary
  const salaryDoc = await EmployeeSalaryModel.findOne({
    employeeId: auth.employee.employeeId,
  }).lean();

  const baseSalary = salaryDoc?.salaryAmount || 0;

  // Get attendance for the month
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0); // Last day of month

  const attendance = await EmployeeAttendanceModel.find({
    employeeId: auth.employee.employeeId,
    date: {
      $gte: startDate.toISOString().split("T")[0],
      $lte: endDate.toISOString().split("T")[0],
    },
  })
    .sort({ date: 1 })
    .lean();

  // Calculate working days in month
  const totalDaysInMonth = endDate.getDate();

  // Count present, absent, half-day, paid leave
  let presentDays = 0;
  let absentDays = 0;
  let halfDays = 0;
  let paidLeaveDays = 0;
  const absentDetails: any[] = [];

  attendance.forEach((att) => {
    if (att.status === "present") {
      presentDays++;
    } else if (att.status === "half-day") {
      halfDays++;
    } else if (att.status === "paid-leave") {
      paidLeaveDays++;
    } else if (att.status === "absent") {
      absentDays++;
      absentDetails.push({
        date: att.date,
        reason: att.reason || "No reason provided",
      });
    }
  });

  // Calculate daily salary
  const dailySalary = baseSalary / totalDaysInMonth;

  // Calculate earned salary
  let earnedSalary =
    presentDays * dailySalary + halfDays * (dailySalary / 2) + paidLeaveDays * dailySalary;

  // Get advance deduction for this month
  const advance = await AdvancedPaymentModel.findOne({
    employeeId: auth.employee.employeeId,
    status: "active",
  }).lean();

  let advanceDeduction = 0;
  if (advance && advance.installments) {
    const monthInstallment = Array.isArray(advance.installments)
      ? advance.installments.find(
          (inst: any) => inst.month === month && inst.status === "deducted"
        )
      : undefined;
    if (monthInstallment) {
      advanceDeduction = monthInstallment.amount || 0;
    }
  }

  // Calculate final salary
  const finalSalary = earnedSalary - advanceDeduction;

  // Check if salary paid for this month
  // Note: You'll need to implement salary payment tracking
  const receivedAmount = 0; // TODO: Get from salary payment records
  const balance = finalSalary - receivedAmount;

  return NextResponse.json({
    month,
    baseSalary,
    totalDaysInMonth,
    presentDays,
    absentDays,
    halfDays,
    paidLeaveDays,
    dailySalary: Math.round(dailySalary * 100) / 100,
    earnedSalary: Math.round(earnedSalary * 100) / 100,
    advanceDeduction: Math.round(advanceDeduction * 100) / 100,
    finalSalary: Math.round(finalSalary * 100) / 100,
    receivedAmount,
    balance: Math.round(balance * 100) / 100,
    absentDetails,
    attendance: attendance.map((att) => ({
      date: att.date,
      status: att.status,
      punchInTime: att.punchInTime,
      punchOutTime: att.punchOutTime,
      hoursWorked: att.hoursWorked,
    })),
  });
}
