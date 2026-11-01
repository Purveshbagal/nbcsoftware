import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AdvancedPaymentModel from "@/models/AdvancedPayment";

// GET - Get advance details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  await connectToDatabase();

  const advance = await AdvancedPaymentModel.findById(id).lean();

  if (!advance) {
    return NextResponse.json({ error: "Advance not found" }, { status: 404 });
  }

  return NextResponse.json({ item: advance });
}
