import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import ExpenseModel from "@/models/Expense";

/**
 * POST /api/sfa/expenses/payment
 * Process payment for multiple expenses
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { expenseIds, amount } = body;

  if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
    return NextResponse.json({ error: "Expense IDs are required" }, { status: 400 });
  }

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
  }

  await connectToDatabase();

  try {
    // Update all specified expenses to paid status
    const result = await ExpenseModel.updateMany(
      { _id: { $in: expenseIds }, paymentStatus: "pending" },
      {
        $set: {
          paymentStatus: "paid",
          paidAmount: Number(amount) / expenseIds.length, // Split amount evenly
          paidAt: new Date(),
          paidBy: {
            username: auth.session.username,
            name: auth.session.name,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `Payment processed for ${result.modifiedCount} expenses`,
    });
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
