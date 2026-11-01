import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createEmployeeToken } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { normalizeIndianMobile, verifyOtp } from "@/lib/fast2sms";
import EmployeeModel from "@/models/Employee";

/**
 * Step 2 of login: Verifies OTP and completes employee sign-in.
 * Employee enters OTP → System verifies with Fast2SMS → Creates session token.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const username = String(body?.username ?? "").toLowerCase().trim();
  const password = String(body?.password ?? "");
  const otp = String(body?.otp ?? "").trim();

  if (!username || !password || !otp) {
    return NextResponse.json(
      { error: "Username, password, and OTP are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Re-validate credentials
  const employee = await EmployeeModel.findOne({ appUsername: username }).select(
    "+appPasswordHash name contactNo appUsername designation zone division isActive appAccessEnabled"
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

  // Get employee's mobile number
  const mobile = normalizeIndianMobile(employee.contactNo);
  if (!mobile) {
    return NextResponse.json(
      { error: "No valid mobile number registered. Contact your administrator." },
      { status: 400 }
    );
  }

  // Verify OTP with Fast2SMS
  const otpValid = await verifyOtp(mobile, otp);
  if (!otpValid) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 }
    );
  }

  // Update last seen info
  const deviceInfo = String(body?.device ?? "").slice(0, 200);
  await EmployeeModel.updateOne(
    { _id: employee._id },
    { lastSeenAt: new Date(), ...(deviceInfo ? { deviceInfo } : {}) }
  );

  // Create session token
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
