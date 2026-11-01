import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import { readJsonBody } from "@/lib/read-json";
import AdvancedPaymentModel from "@/models/AdvancedPayment";

// PATCH - Pass an installment month
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await readJsonBody(request);

  const { installmentIndex, addToNext } = body;

  if (installmentIndex === undefined) {
    return NextResponse.json(
      { error: "Installment index is required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const advance = await AdvancedPaymentModel.findById(id);

  if (!advance) {
    return NextResponse.json({ error: "Advance not found" }, { status: 404 });
  }

  if (advance.paymentType !== "installment" || !advance.installments) {
    return NextResponse.json(
      { error: "Only installment advances can have passed months" },
      { status: 400 }
    );
  }

  if (installmentIndex < 0 || installmentIndex >= advance.installments.length) {
    return NextResponse.json({ error: "Invalid installment index" }, { status: 400 });
  }

  const installment = advance.installments[installmentIndex];

  if (installment.status !== "pending") {
    return NextResponse.json(
      { error: "Can only pass pending installments" },
      { status: 400 }
    );
  }

  // Mark current as passed
  installment.status = "passed";

  if (addToNext === true) {
    // Add amount to next pending installment
    const nextIndex = advance.installments.findIndex(
      (inst, idx) => idx > installmentIndex && inst.status === "pending"
    );

    if (nextIndex >= 0) {
      advance.installments[nextIndex].amount += installment.amount;
      installment.addedToNextMonth = true;
    }
  } else {
    // Shift all future installments forward by 1 month
    const currentMonth = installment.month;
    const [year, month] = currentMonth.split("-").map(Number);

    for (let i = installmentIndex + 1; i < advance.installments.length; i++) {
      const inst = advance.installments[i];
      const [instYear, instMonth] = inst.month.split("-").map(Number);
      const date = new Date(instYear, instMonth, 1);
      date.setMonth(date.getMonth() + 1);

      inst.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  await advance.save();

  return NextResponse.json({ item: advance });
}
