import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { Fast2SmsError, maskMobile, normalizeIndianMobile, sendOtp } from "@/lib/fast2sms";
import EmployeeModel from "@/models/Employee";

/**
 * Step 1 of login: Validates username/password and sends OTP to employee's WhatsApp.
 * Employee enters credentials → System validates → Sends OTP to registered mobile number.
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
    "+appPasswordHash name contactNo isActive appAccessEnabled"
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

  try {
    await sendOtp(mobile);
  } catch (error) {
    console.error("Fast2SMS send OTP failed", error);
    const message =
      error instanceof Fast2SmsError ? error.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    sentTo: maskMobile(mobile),
    message: "OTP sent successfully to your WhatsApp number"
  });
}
