import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializePayment } from "@/lib/serialize-payment";
import PaymentModel from "@/models/Payment";
import ProductModel from "@/models/Product";
import RegistrationModel from "@/models/Registration";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;

  await connectToDatabase();

  if (body.status !== undefined) {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const payment = await PaymentModel.findByIdAndUpdate(
      id,
      {
        status: body.status,
        reviewedBy: { username: session.username, name: session.name },
        reviewedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!payment) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment: serializePayment(payment) });
  }

  const existing = await PaymentModel.findById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Payment request not found" },
      { status: 404 }
    );
  }

  const isOwner = existing.requestedBy?.username === session.username;
  if (session.role !== "admin") {
    if (!isOwner || existing.status !== "pending") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { doctorId, productId, amount, purpose } = body;

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

  const payment = await PaymentModel.findByIdAndUpdate(
    id,
    {
      doctorId: registration.doctorId,
      doctorName: registration.doctorName,
      productId: product._id.toString(),
      productName: product.name,
      productComposition: product.composition,
      amount: parsedAmount,
      purpose,
    },
    { new: true }
  ).lean();

  return NextResponse.json({ payment: payment && serializePayment(payment) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await connectToDatabase();

  const payment = await PaymentModel.findByIdAndDelete(id);

  if (!payment) {
    return NextResponse.json(
      { error: "Payment request not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
