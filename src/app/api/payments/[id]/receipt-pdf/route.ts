import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import PaymentModel from "@/models/Payment";
import RegistrationModel from "@/models/Registration";

export async function GET(
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
      { error: "This payment has not been given yet" },
      { status: 403 }
    );
  }

  const registration = await RegistrationModel.findOne({
    doctorId: payment.doctorId,
  });

  const pdfBytes = await generateReceiptPdf({
    receiptNumber: payment.receiptNumber ?? "",
    paidAt: payment.paidAt,
    doctorName: payment.doctorName,
    hospitalName: registration?.hospitalName ?? undefined,
    address:
      registration?.hospitalAddress || registration?.doctorAddress || undefined,
    surveyFormNo: payment.surveyFormNo ?? "",
    productName: payment.productName,
    amount: payment.amount,
    tdsAmount: payment.tdsAmount ?? 0,
    netAmount: payment.netAmount ?? payment.amount,
    transactionRefNumber: payment.transactionRefNumber ?? "",
    paidToName: payment.requestedBy?.name ?? payment.doctorName,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
    },
  });
}
