import { NextResponse } from "next/server";

import { createEmployeeToken } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { normalizeIndianMobile, verifyOtp } from "@/lib/fast2sms";
import EmployeeModel from "@/models/Employee";

/**
 * Verifies OTP and signs in employee to the mobile app.
 * Unlike password-based login, this uses OTP sent to WhatsApp.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const contactNo = String(body?.contactNo ?? "").trim();
  const otp = String(body?.otp ?? "").trim();

  if (!contactNo || !otp) {
    return NextResponse.json(
      { error: "Mobile number and OTP are required" },
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

  // Verify OTP with Fast2SMS
  const valid = await verifyOtp(mobile, otp);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const employee = await EmployeeModel.findOne({ contactNo: mobile }).select(
    "name appUsername designation zone division isActive appAccessEnabled"
  );

  if (!employee) {
    return NextResponse.json(
      { error: "No employee found with this mobile number" },
      { status: 404 }
    );
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
    username: employee.appUsername || employee._id.toString(),
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
