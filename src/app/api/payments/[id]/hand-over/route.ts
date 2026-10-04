import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { verifyOtp } from "@/lib/fast2sms";
import { loadHandOverTarget } from "@/lib/hand-over";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { serializePayment } from "@/lib/serialize-payment";

/**
 * Records that the field rep has handed the disbursed cash to the doctor.
 * Only allowed once an admin has given the payment and generated its receipt,
 * and only with the OTP sent to the doctor's WhatsApp via `send-otp`.
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
  const body = await readJsonBody(request);
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  if (!/^\d{4,8}$/.test(otp)) {
    return NextResponse.json(
      { error: "Enter the OTP sent to the doctor's WhatsApp" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const target = await loadHandOverTarget(id, session);
  if ("error" in target) return target.error;
  const { payment, mobile } = target;

  let verified = false;
  try {
    verified = await verifyOtp(mobile, otp);
  } catch (error) {
    console.error("Fast2SMS verify OTP failed", error);
    return NextResponse.json(
      { error: "Could not verify the OTP. Please try again." },
      { status: 502 }
    );
  }
  if (!verified) {
    return NextResponse.json(
      { error: "Incorrect OTP. Please try again." },
      { status: 400 }
    );
  }

  payment.handedOverAt = new Date();
  payment.handedOverBy = { username: session.username, name: session.name };
  await payment.save();

  return NextResponse.json({ payment: serializePayment(payment.toObject()) });
}
