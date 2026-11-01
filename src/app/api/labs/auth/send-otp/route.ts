import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { Fast2SmsError, maskMobile, normalizeIndianMobile, sendOtp } from "@/lib/fast2sms";
import EmployeeModel from "@/models/Employee";

/**
 * Sends OTP to employee's WhatsApp number for mobile app login.
 * The employee submits their mobile number, and we send an OTP via Fast2SMS.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const contactNo = String(body?.contactNo ?? "").trim();

  if (!contactNo) {
    return NextResponse.json(
      { error: "Mobile number is required" },
      { status: 400 }
    );
  }

  const mobile = normalizeIndianMobile(contactNo);
  if (!mobile) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit mobile number" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Check if employee exists with this mobile number
  const employee = await EmployeeModel.findOne({ contactNo: mobile }).select(
    "name isActive appAccessEnabled"
  );

  if (!employee) {
    return NextResponse.json(
      { error: "No employee found with this mobile number" },
      { status: 404 }
    );
  }

  if (employee.isActive === false || !employee.appAccessEnabled) {
    return NextResponse.json(
      { error: "App access is disabled for this account. Contact your administrator." },
      { status: 403 }
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
