import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";

/** The employee changes their own app password. */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  const current = String(body?.currentPassword ?? "");
  const next = String(body?.newPassword ?? "");

  if (next.length < 6) {
    return NextResponse.json(
      { error: "The new password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const employee = await EmployeeModel.findById(auth.employee.employeeId).select("+appPasswordHash");
  if (!employee?.appPasswordHash || !(await bcrypt.compare(current, employee.appPasswordHash))) {
    return NextResponse.json({ error: "Your current password is incorrect" }, { status: 400 });
  }

  employee.appPasswordHash = await bcrypt.hash(next, 10);
  await employee.save();

  return NextResponse.json({ ok: true });
}
