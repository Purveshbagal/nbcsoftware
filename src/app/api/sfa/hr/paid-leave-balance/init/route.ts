import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import EmployeeModel from "@/models/Employee";
import PaidLeaveBalanceModel from "@/models/PaidLeaveBalance";

// POST - Initialize paid leave balance for all employees
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const year = new Date().getFullYear();

  await connectToDatabase();

  // Get all active employees
  const employees = await EmployeeModel.find({ status: "active" }).select("_id code name");

  if (!employees || employees.length === 0) {
    return NextResponse.json({ error: "No active employees found" }, { status: 404 });
  }

  let created = 0;
  let skipped = 0;

  for (const employee of employees) {
    // Check if balance already exists
    const existing = await PaidLeaveBalanceModel.findOne({
      employeeId: employee._id,
      year,
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create new balance
    await PaidLeaveBalanceModel.create({
      employeeId: employee._id,
      employeeCode: employee.code,
      employeeName: employee.name,
      year,
      totalAllowed: 12,
      used: 0,
      remaining: 12,
    });

    created++;
  }

  return NextResponse.json({
    message: "Initialization complete",
    year,
    created,
    skipped,
    total: employees.length,
  });
}
