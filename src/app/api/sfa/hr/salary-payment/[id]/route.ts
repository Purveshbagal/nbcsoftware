import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import SalaryPaymentModel from "@/models/SalaryPayment";

// GET - Get salary payment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  await connectToDatabase();

  const payment = await SalaryPaymentModel.findById(id).lean();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ item: payment });
}
