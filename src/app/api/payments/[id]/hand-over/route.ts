import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializePayment } from "@/lib/serialize-payment";
import PaymentModel from "@/models/Payment";

/**
 * Records that the field rep has handed the disbursed cash to the doctor.
 * Only allowed once an admin has given the payment and generated its receipt.
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

  const payment = await PaymentModel.findById(id);
  if (!payment) {
    return NextResponse.json(
      { error: "Payment request not found" },
      { status: 404 }
    );
  }

  const isOwner = payment.requestedBy?.username === session.username;
  if (session.role !== "admin" && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!payment.paidAt) {
    return NextResponse.json(
      { error: "The admin has not generated the receipt for this payment yet" },
      { status: 400 }
    );
  }
  if (payment.handedOverAt) {
    return NextResponse.json(
      { error: "This payment has already been given to the doctor" },
      { status: 400 }
    );
  }

  payment.handedOverAt = new Date();
  payment.handedOverBy = { username: session.username, name: session.name };
  await payment.save();

  return NextResponse.json({ payment: serializePayment(payment.toObject()) });
}
