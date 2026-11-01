import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import EmployeeModel from "@/models/Employee";
import EmployeeSalaryModel from "@/models/EmployeeSalary";
import AttendanceModel from "@/models/Attendance";
import AdvancedPaymentModel from "@/models/AdvancedPayment";
import LeaveModel from "@/models/Leave";

/**
 * Get pending salary for all employees for a specific month
 * Calculates: present days, absent days, paid leave days, deductions, net payable
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");

  // Default to current month if not provided
  const now = new Date();
  const month = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  await connectToDatabase();

  // Get all active employees with salary
  const employees = await EmployeeModel.find({ isActive: { $ne: false } })
    .select("_id code name designation contactNo")
    .lean();

  const salaryData = await EmployeeSalaryModel.find({}).lean();
  const salaryMap = new Map(
    salaryData.map((s) => [s.employeeId.toString(), s])
  );

  // Get attendance for the month
  const attendanceRecords = await AttendanceModel.find({
    date: { $regex: `^${month}` }
  }).lean();

  // Group attendance by employee
  const attendanceByEmployee = new Map<string, any[]>();
  for (const att of attendanceRecords) {
    const empId = att.employeeId.toString();
    if (!attendanceByEmployee.has(empId)) {
      attendanceByEmployee.set(empId, []);
    }
    attendanceByEmployee.get(empId)!.push(att);
  }

  // Get all active advances
  const activeAdvances = await AdvancedPaymentModel.find({
    status: "active"
  }).lean();

  const advanceMap = new Map(
    activeAdvances.map((a) => [a.employeeId.toString(), a])
  );

  // Get approved paid leaves for the month
  const approvedLeaves = await LeaveModel.find({
    status: "approved",
    leaveType: { $in: ["Casual", "Sick", "Earned"] },
    $or: [
      { fromDate: { $regex: `^${month}` } },
      { toDate: { $regex: `^${month}` } }
    ]
  }).lean();

  const leavesByEmployee = new Map<string, any[]>();
  for (const leave of approvedLeaves) {
    const empId = leave.employeeId?.toString();
    if (!empId) continue;
    if (!leavesByEmployee.has(empId)) {
      leavesByEmployee.set(empId, []);
    }
    leavesByEmployee.get(empId)!.push(leave);
  }

  // Calculate pending salary for each employee
  const items = employees.map((emp) => {
    const empId = emp._id.toString();
    const salary = salaryMap.get(empId);
    const monthlySalary = salary?.salaryAmount || 0;

    if (monthlySalary === 0) {
      return {
        _id: empId,
        employeeCode: emp.code,
        employeeName: emp.name,
        designation: emp.designation,
        monthlySalary: 0,
        presentDays: 0,
        absentDays: 0,
        paidLeaveDays: 0,
        totalWorkingDays: daysInMonth,
        perDayRate: 0,
        absentDeduction: 0,
        advanceDeduction: 0,
        netPayable: 0,
      };
    }

    const perDayRate = monthlySalary / daysInMonth;
    const attendance = attendanceByEmployee.get(empId) || [];

    // Count days
    const presentDays = attendance.filter(a => a.status === "present").length;

    // Calculate paid leave days from approved leaves
    let paidLeaveDays = 0;
    const leaves = leavesByEmployee.get(empId) || [];
    for (const leave of leaves) {
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);
      const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Only count days that fall within the selected month
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

    // Get advance deduction for this month
    let advanceDeduction = 0;
    const advance = advanceMap.get(empId);

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

    return {
      _id: empId,
      employeeCode: emp.code,
      employeeName: emp.name,
      designation: emp.designation,
      contactNo: emp.contactNo,
      monthlySalary,
      presentDays,
      absentDays,
      paidLeaveDays,
      totalWorkingDays: daysInMonth,
      perDayRate: Number(perDayRate.toFixed(2)),
      absentDeduction: Number(absentDeduction.toFixed(2)),
      advanceDeduction: Number(advanceDeduction.toFixed(2)),
      netPayable: Number(netPayable.toFixed(2)),
    };
  });

  // Filter out employees with no salary set
  const itemsWithSalary = items.filter(item => item.monthlySalary > 0);

  return NextResponse.json({
    items: itemsWithSalary,
    month,
    daysInMonth
  });
}
