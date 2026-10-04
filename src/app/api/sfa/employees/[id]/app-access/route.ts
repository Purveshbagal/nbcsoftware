import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { requireAdmin } from "@/lib/sfa-crud";
import EmployeeModel from "@/models/Employee";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;

/**
 * Set an employee's NBC Labs app login. Body: `{ username?, password?, enabled? }`.
 * A password is required the first time a login is created; afterwards it is
 * only changed when sent.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await connectToDatabase();
  const employee = await EmployeeModel.findById(id).select("+appPasswordHash");
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if ("username" in body) {
    const username = String(body.username ?? "").toLowerCase().trim();
    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { error: "Login ID must be 3–40 characters: letters, numbers, dot, dash or underscore" },
        { status: 400 }
      );
    }
    const taken = await EmployeeModel.exists({ appUsername: username, _id: { $ne: employee._id } });
    if (taken) {
      return NextResponse.json({ error: `Login ID "${username}" is already in use` }, { status: 409 });
    }
    employee.appUsername = username;
  }

  const password = String(body.password ?? "");
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    employee.appPasswordHash = await bcrypt.hash(password, 10);
  }

  if ("enabled" in body) employee.appAccessEnabled = Boolean(body.enabled);

  if (employee.appAccessEnabled && (!employee.appUsername || !employee.appPasswordHash)) {
    return NextResponse.json(
      { error: "Set a login ID and password before switching app access on" },
      { status: 400 }
    );
  }

  await employee.save();

  return NextResponse.json({
    item: {
      _id: employee._id.toString(),
      appUsername: employee.appUsername ?? "",
      appAccessEnabled: employee.appAccessEnabled,
      hasPassword: Boolean(employee.appPasswordHash),
    },
  });
}
