import { NextResponse } from "next/server";

import type { SessionPayload } from "@/lib/auth";
import { normalizeIndianMobile } from "@/lib/fast2sms";
import PaymentModel from "@/models/Payment";
import RegistrationModel from "@/models/Registration";

/**
 * Loads a payment the session may hand over to the doctor, together with the
 * doctor's mobile number the OTP goes to. Returns an error response when the
 * hand-over is not allowed. Expects the database to be connected.
 */
export async function loadHandOverTarget(id: string, session: SessionPayload) {
  const payment = await PaymentModel.findById(id);
  if (!payment) {
    return {
      error: NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      ),
    };
  }

  const isOwner = payment.requestedBy?.username === session.username;
  if (session.role !== "admin" && !isOwner) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (!payment.paidAt) {
    return {
      error: NextResponse.json(
        {
          error:
            "The admin has not generated the receipt for this payment yet",
        },
        { status: 400 }
      ),
    };
  }
  if (payment.handedOverAt) {
    return {
      error: NextResponse.json(
        { error: "This payment has already been given to the doctor" },
        { status: 400 }
      ),
    };
  }

  const registration = await RegistrationModel.findOne({
    doctorId: payment.doctorId,
  });
  const mobile = normalizeIndianMobile(registration?.mobileNumber);
  if (!mobile) {
    return {
      error: NextResponse.json(
        {
          error:
            "This doctor has no valid WhatsApp mobile number in their registration",
        },
        { status: 400 }
      ),
    };
  }

  return { payment, mobile };
}
