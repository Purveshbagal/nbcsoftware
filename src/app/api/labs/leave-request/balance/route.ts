import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import PaidLeaveBalanceModel from "@/models/PaidLeaveBalance";
import EmployeeModel from "@/models/Employee";

export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const employee = auth.employee!;
  const year = new Date().getFullYear();

  await connectToDatabase();

  let balance = await PaidLeaveBalanceModel.findOne({
    employeeId: employee.employeeId,
    year,
  });

  if (!balance) {
    const emp = await EmployeeModel.findById(employee.employeeId).select("code name");
    balance = await PaidLeaveBalanceModel.create({
      employeeId: employee.employeeId,
      employeeCode: emp?.code || "",
      employeeName: emp?.name || employee.name,
      year,
      totalAllowed: 12,
      used: 0,
      remaining: 12,
    });
  }

  return NextResponse.json({
    totalAllowed: balance.totalAllowed,
    used: balance.used,
    remaining: balance.remaining,
  });
}
