import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializePayment } from "@/lib/serialize-payment";
import PaymentModel from "@/models/Payment";
import ProductModel from "@/models/Product";
import RegistrationModel from "@/models/Registration";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const readyForPayment = searchParams.get("readyForPayment");

  const query: Record<string, unknown> = status ? { status } : {};
  if (readyForPayment === "true") {
    query.status = "approved";
    query["surveyUpload.data"] = { $exists: true };
    query.paidAt = { $exists: false };
  }
  if (session.role !== "admin") {
    query["requestedBy.username"] = session.username;
  }

  const payments = await PaymentModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ payments: payments.map(serializePayment) });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { doctorId, productId, amount, purpose } = await request.json();

  const parsedAmount = Number(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "A valid amount is required" },
      { status: 400 }
    );
  }

  if (!doctorId || !productId) {
    return NextResponse.json(
      { error: "A doctor and a product are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const [registration, product] = await Promise.all([
    RegistrationModel.findOne({ doctorId, status: "approved" }),
    ProductModel.findById(productId),
  ]);

  if (!registration) {
    return NextResponse.json(
      { error: "Doctor not found or not yet approved" },
      { status: 400 }
    );
  }
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }

  const payment = await PaymentModel.create({
    doctorId: registration.doctorId,
    doctorName: registration.doctorName,
    productId: product._id.toString(),
    productName: product.name,
    productComposition: product.composition,
    amount: parsedAmount,
    purpose,
    status: "pending",
    requestedBy: {
      username: session.username,
      name: session.name,
    },
  });

  return NextResponse.json(
    { payment: serializePayment(payment.toObject()) },
    { status: 201 }
  );
}
