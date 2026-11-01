import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import LeaveRequestModel from "@/models/LeaveRequest";
import EmployeeModel from "@/models/Employee";
import PaidLeaveBalanceModel from "@/models/PaidLeaveBalance";

export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const employee = auth.employee!;
  const body = await readJsonBody(request);

  const { leaveType, fromDate, toDate, reason } = body;

  if (!leaveType || !fromDate || !toDate || !reason) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!["leave", "paid_leave"].includes(leaveType)) {
    return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (to < from) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (leaveType === "paid_leave") {
    if (totalDays > 2) {
      return NextResponse.json(
        { error: "Paid leave limited to 2 days per application" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const year = new Date().getFullYear();
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

    if (balance.remaining < totalDays) {
      return NextResponse.json(
        { error: `Only ${balance.remaining} paid leave days remaining` },
        { status: 400 }
      );
    }
  } else {
    await connectToDatabase();
  }

  const emp = await EmployeeModel.findById(employee.employeeId).select("code name");

  const leaveReq = await LeaveRequestModel.create({
    employeeId: employee.employeeId,
    employeeCode: emp?.code || "",
    employeeName: emp?.name || employee.name,
    leaveType,
    fromDate,
    toDate,
    totalDays,
    reason,
    status: "pending",
  });

  return NextResponse.json({ item: leaveReq }, { status: 201 });
}
