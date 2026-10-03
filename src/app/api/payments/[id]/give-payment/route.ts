import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializePayment } from "@/lib/serialize-payment";
import { getNextSequence } from "@/models/Counter";
import PaymentModel from "@/models/Payment";

const TDS_AMOUNT = 1000;
const RECEIPT_NUMBER_BASE = 100000;

function generateTransactionRefNumber() {
  let digits = "";
  for (let i = 0; i < 18; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return `T${digits}`;
}

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

  if (payment.status !== "approved") {
    return NextResponse.json(
      { error: "This payment request has not been approved yet" },
      { status: 400 }
    );
  }
  if (!payment.surveyUpload?.data) {
    return NextResponse.json(
      { error: "The survey form has not been uploaded yet" },
      { status: 400 }
    );
  }
  if (payment.paidAt) {
    return NextResponse.json(
      { error: "This payment has already been given" },
      { status: 400 }
    );
  }

  const seq = await getNextSequence("receiptNumber");
  const tdsAmount = Math.min(TDS_AMOUNT, payment.amount);

  payment.receiptNumber = String(RECEIPT_NUMBER_BASE + seq);
  payment.transactionRefNumber = generateTransactionRefNumber();
  payment.tdsAmount = tdsAmount;
  payment.netAmount = payment.amount - tdsAmount;
  payment.paidAt = new Date();
  payment.paidBy = { username: session.username, name: session.name };
  await payment.save();

  return NextResponse.json({ payment: serializePayment(payment.toObject()) });
}
