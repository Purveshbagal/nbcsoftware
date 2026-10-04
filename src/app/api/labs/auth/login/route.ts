import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createEmployeeToken } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";

/**
 * Sign-in for the NBC Labs employee app. Credentials are the app login an
 * administrator sets on the employee under People → Mobile App Access; NBC
 * Pedia user accounts are not looked at.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const username = String(body?.username ?? "").toLowerCase().trim();
  const password = String(body?.password ?? "");

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const employee = await EmployeeModel.findOne({ appUsername: username }).select(
    "+appPasswordHash name appUsername designation zone division isActive appAccessEnabled"
  );

  const valid =
    employee?.appPasswordHash && (await bcrypt.compare(password, employee.appPasswordHash));

  if (!employee || !valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (employee.isActive === false || !employee.appAccessEnabled) {
    return NextResponse.json(
      { error: "App access is switched off for this account. Contact your administrator." },
      { status: 403 }
    );
  }

  const deviceInfo = String(body?.device ?? "").slice(0, 200);
  await EmployeeModel.updateOne(
    { _id: employee._id },
    { lastSeenAt: new Date(), ...(deviceInfo ? { deviceInfo } : {}) }
  );

  const token = await createEmployeeToken({
    employeeId: employee._id.toString(),
    username: employee.appUsername!,
    name: employee.name,
  });

  return NextResponse.json({
    ok: true,
    token,
    employee: {
      id: employee._id.toString(),
      username: employee.appUsername,
      name: employee.name,
      designation: employee.designation ?? "",
      zone: employee.zone ?? "",
      division: employee.division ?? "",
    },
  });
}
