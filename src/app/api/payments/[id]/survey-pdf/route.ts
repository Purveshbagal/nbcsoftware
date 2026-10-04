import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { generateSurveyPdf } from "@/lib/survey-pdf";
import { getNextSequence } from "@/models/Counter";
import PaymentModel from "@/models/Payment";
import ProductModel from "@/models/Product";
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

  if (payment.status !== "approved") {
    return NextResponse.json(
      { error: "This payment request has not been approved yet" },
      { status: 403 }
    );
  }

  if (!payment.surveyFormNo) {
    const seq = await getNextSequence("surveyFormNo");
    payment.surveyFormNo = `SF-${String(seq).padStart(4, "0")}`;
  }
  if (!payment.surveyDownloadedAt) {
    payment.surveyDownloadedAt = new Date();
  }
  await payment.save();

  const [registration, product] = await Promise.all([
    RegistrationModel.findOne({ doctorId: payment.doctorId }),
    ProductModel.findById(payment.productId),
  ]);

  const pdfBytes = await generateSurveyPdf({
    formNo: payment.surveyFormNo,
    productName: payment.productName,
    productComposition: payment.productComposition ?? "",
    specialClaim: product?.specialClaim ?? undefined,
    doctorName: payment.doctorName,
    address:
      registration?.hospitalAddress || registration?.doctorAddress || "",
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payment.surveyFormNo}-survey.pdf"`,
    },
  });
}
