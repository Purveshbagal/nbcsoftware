import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { Fast2SmsError, maskMobile, sendOtp } from "@/lib/fast2sms";
import { loadHandOverTarget } from "@/lib/hand-over";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Sends a Fast2SMS OTP to the doctor's WhatsApp number. The rep must enter it
 * in the hand-over call to prove the doctor received the payment.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectToDatabase();

  const target = await loadHandOverTarget(id, session);
  if ("error" in target) return target.error;

  try {
    await sendOtp(target.mobile);
  } catch (error) {
    console.error("Fast2SMS send OTP failed", error);
    const message =
      error instanceof Fast2SmsError ? error.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ sentTo: maskMobile(target.mobile) });
}
