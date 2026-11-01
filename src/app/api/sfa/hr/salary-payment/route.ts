import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import { readJsonBody } from "@/lib/read-json";
import SalaryPaymentModel from "@/models/SalaryPayment";
import EmployeeModel from "@/models/Employee";
import EmployeeSalaryModel from "@/models/EmployeeSalary";
import AttendanceModel from "@/models/Attendance";
import AdvancedPaymentModel from "@/models/AdvancedPayment";
import LeaveModel from "@/models/Leave";

// GET - List all salary payments
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const payments = await SalaryPaymentModel.find({})
    .sort({ paymentDate: -1, createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ items: payments });
}

// POST - Give salary payment
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { employeeId, month, paymentDate, paymentMode, remarks } = body;

  if (!employeeId || !month || !paymentDate) {
    return NextResponse.json(
      { error: "Employee ID, month, and payment date are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Check if payment already exists for this employee and month
  const existing = await SalaryPaymentModel.findOne({ employeeId, month });
  if (existing) {
    return NextResponse.json(
      { error: "Salary payment already recorded for this month" },
      { status: 409 }
    );
  }

  // Get employee details
  const employee = await EmployeeModel.findById(employeeId).select("code name");
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Get salary
  const salary = await EmployeeSalaryModel.findOne({ employeeId });
  if (!salary || salary.salaryAmount === 0) {
    return NextResponse.json(
      { error: "No salary set for this employee" },
      { status: 400 }
    );
  }

  const monthlySalary = salary.salaryAmount;
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const perDayRate = monthlySalary / daysInMonth;

  // Calculate attendance
  const attendance = await AttendanceModel.find({
    employeeId,
    date: { $regex: `^${month}` }
  }).lean();

  const presentDays = attendance.filter(a => a.status === "present").length;

  // Get approved paid leaves
  const leaves = await LeaveModel.find({
    employeeId,
    status: "approved",
    leaveType: { $in: ["Casual", "Sick", "Earned"] },
    $or: [
      { fromDate: { $regex: `^${month}` } },
      { toDate: { $regex: `^${month}` } }
    ]
  }).lean();

  let paidLeaveDays = 0;
  for (const leave of leaves) {
    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    for (let d = 0; d < days; d++) {
      const date = new Date(from);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().slice(0, 7);
      if (dateStr === month) {
        paidLeaveDays++;
      }
    }
  }

  const absentDays = daysInMonth - presentDays - paidLeaveDays;
  const absentDeduction = Math.max(0, absentDays * perDayRate);

  // Get advance deduction
  let advanceDeduction = 0;
  const advance = await AdvancedPaymentModel.findOne({
    employeeId,
    status: "active"
  });

  if (advance) {
    if (advance.paymentType === "one_time") {
      if (advance.deductFromMonth === month) {
        advanceDeduction = advance.advanceAmount;
      }
    } else if (advance.paymentType === "installment") {
      const installment = advance.installments?.find(
        (inst: any) => inst.month === month && inst.status === "pending"
      );
      advanceDeduction = installment?.amount || 0;
    }
  }

  const netPayable = monthlySalary - absentDeduction - advanceDeduction;

  // Create salary payment record
  const payment = await SalaryPaymentModel.create({
    employeeId,
    employeeCode: employee.code,
    employeeName: employee.name,
    month,
    salaryAmount: monthlySalary,
    presentDays,
    absentDays,
    paidLeaveDays,
    totalWorkingDays: daysInMonth,
    absentDeduction: Number(absentDeduction.toFixed(2)),
    advanceDeduction: Number(advanceDeduction.toFixed(2)),
    netPayable: Number(netPayable.toFixed(2)),
    paidAmount: Number(netPayable.toFixed(2)),
    paymentDate,
    paymentMode: paymentMode || "cash",
    remarks: remarks || "",
    paidBy: { username: auth.session!.username, name: auth.session!.name },
  });

  // Update advance if applicable
  if (advance && advanceDeduction > 0) {
    if (advance.paymentType === "one_time") {
      advance.status = "completed";
      advance.totalDeducted = advance.advanceAmount;
      advance.remainingAmount = 0;
      await advance.save();
    } else if (advance.paymentType === "installment") {
      const installmentIndex = advance.installments?.findIndex(
        (inst: any) => inst.month === month && inst.status === "pending"
      );

      if (installmentIndex !== undefined && installmentIndex >= 0 && advance.installments) {
        advance.installments[installmentIndex].status = "deducted";
        advance.installments[installmentIndex].deductedOn = paymentDate;
        advance.totalDeducted += advanceDeduction;
        advance.remainingAmount -= advanceDeduction;

        // Check if all installments are deducted
        const allDeducted = advance.installments.every(
          (inst: any) => inst.status === "deducted" || inst.status === "passed" || inst.status === "skipped"
        );

        if (allDeducted || advance.remainingAmount <= 0) {
          advance.status = "completed";
          advance.remainingAmount = 0;
        }

        await advance.save();
      }
    }
  }

  return NextResponse.json({ item: payment }, { status: 201 });
}
