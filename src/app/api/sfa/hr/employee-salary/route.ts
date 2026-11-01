import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import { readJsonBody } from "@/lib/read-json";
import EmployeeSalaryModel from "@/models/EmployeeSalary";
import EmployeeModel from "@/models/Employee";

// GET - List all employees with their salary
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  // Get all active employees
  const employees = await EmployeeModel.find({ isActive: { $ne: false } })
    .select("code name designation contactNo")
    .sort({ name: 1 })
    .lean();

  // Get salary data for all employees
  const salaryData = await EmployeeSalaryModel.find({}).lean();
  const salaryMap = new Map(
    salaryData.map((s) => [s.employeeId.toString(), s])
  );

  // Combine employee and salary data
  const items = employees.map((emp) => {
    const salary = salaryMap.get(emp._id.toString());
    return {
      _id: emp._id.toString(),
      employeeCode: emp.code,
      employeeName: emp.name,
      designation: emp.designation,
      contactNo: emp.contactNo,
      salaryAmount: salary?.salaryAmount || 0,
      effectiveFrom: salary?.effectiveFrom || "",
      updatedBy: salary?.updatedBy || null,
      updatedAt: salary?.updatedAt || null,
    };
  });

  return NextResponse.json({ items });
}

// POST - Set/Update employee salary
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { employeeId, salaryAmount, effectiveFrom } = body;

  if (!employeeId || salaryAmount === undefined) {
    return NextResponse.json(
      { error: "Employee ID and salary amount are required" },
      { status: 400 }
    );
  }

  if (salaryAmount < 0) {
    return NextResponse.json(
      { error: "Salary amount cannot be negative" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Get employee details
  const employee = await EmployeeModel.findById(employeeId).select("code name");
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Update or create salary record
  const salaryData = {
    employeeId,
    employeeCode: employee.code,
    employeeName: employee.name,
    salaryAmount: Number(salaryAmount),
    effectiveFrom: effectiveFrom || new Date().toISOString().slice(0, 10),
    updatedBy: { username: auth.session!.username, name: auth.session!.name },
  };

  const updated = await EmployeeSalaryModel.findOneAndUpdate(
    { employeeId },
    salaryData,
    { upsert: true, new: true }
  );

  return NextResponse.json({ item: updated }, { status: 200 });
}
