import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import AdvancedPaymentModel from "@/models/AdvancedPayment";

// PATCH - Force close an advance
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  await connectToDatabase();

  const advance = await AdvancedPaymentModel.findById(id);

  if (!advance) {
    return NextResponse.json({ error: "Advance not found" }, { status: 404 });
  }

  if (advance.status !== "active") {
    return NextResponse.json(
      { error: "Can only close active advances" },
      { status: 400 }
    );
  }

  advance.status = "closed";
  advance.closedDate = new Date().toISOString().slice(0, 10);
  advance.closedBy = { username: auth.session!.username, name: auth.session!.name };
  advance.remainingAmount = 0;

  // Mark all pending installments as skipped
  if (advance.installments) {
    for (const inst of advance.installments) {
      if (inst.status === "pending") {
        inst.status = "skipped";
      }
    }
  }

  await advance.save();

  return NextResponse.json({ item: advance });
}
