import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { normalizeIndianMobile, verifyOtp } from "@/lib/fast2sms";
import UserModel from "@/models/User";

/**
 * Step 2 of Survey NBC user login: Verifies OTP and completes user sign-in.
 * User enters OTP → System verifies with Fast2SMS → Creates session token.
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
  const user = await UserModel.findOne({ username }).select(
    "username password name mobileNumber role isActive"
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

  // Verify OTP with Fast2SMS
  const otpValid = await verifyOtp(mobile, otp);
  if (!otpValid) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 }
    );
  }

  // Create session token
  const token = await createSession({
    userId: user._id.toString(),
    username: user.username,
    name: user.name,
    role: user.role === "field" ? "field" : "admin",
  });

  return NextResponse.json({
    ok: true,
    token,
    user: {
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
}
