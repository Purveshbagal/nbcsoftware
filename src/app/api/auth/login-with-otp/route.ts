import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { Fast2SmsError, maskMobile, normalizeIndianMobile, sendOtp } from "@/lib/fast2sms";
import UserModel from "@/models/User";

/**
 * Step 1 of Survey NBC user login: Validates username/password and sends OTP to user's WhatsApp.
 * User enters credentials → System validates → Sends OTP to registered mobile number.
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

  const user = await UserModel.findOne({ username }).select(
    "+password name mobileNumber isActive"
  );

  const valid = user?.password && (await bcrypt.compare(password, user.password));

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (user.isActive === false) {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact your administrator." },
      { status: 403 }
    );
  }

  // Get user's mobile number
  const mobile = normalizeIndianMobile(user.mobileNumber);
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
