import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentModel from "@/models/Payment";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

async function loadPayment(id: string) {
  await connectToDatabase();
  return PaymentModel.findById(id);
}

function authorize(
  session: { role: string; username: string },
  payment: { requestedBy?: { username?: string | null } | null }
) {
  const isOwner = payment.requestedBy?.username === session.username;
  return session.role === "admin" || isOwner;
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
  const payment = await loadPayment(id);
  if (!payment) {
    return NextResponse.json(
      { error: "Payment request not found" },
      { status: 404 }
    );
  }

  if (!authorize(session, payment)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!payment.surveyDownloadedAt) {
    return NextResponse.json(
      { error: "Download the survey form before uploading it back" },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG or PDF files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 8MB)" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  payment.surveyUpload = {
    data: bytes,
    mimeType: file.type,
    uploadedAt: new Date(),
  };
  await payment.save();

  return NextResponse.json({ ok: true, uploadedAt: payment.surveyUpload.uploadedAt });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payment = await loadPayment(id);
  if (!payment) {
    return NextResponse.json(
      { error: "Payment request not found" },
      { status: 404 }
    );
  }

  if (!authorize(session, payment)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!payment.surveyUpload?.data) {
    return NextResponse.json({ error: "No file uploaded yet" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(payment.surveyUpload.data), {
    status: 200,
    headers: {
      "Content-Type": payment.surveyUpload.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${payment.surveyFormNo || id}-upload"`,
    },
  });
}
