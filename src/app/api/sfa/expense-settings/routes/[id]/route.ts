import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import ExpenseRouteModel from "@/models/ExpenseRoute";

/**
 * DELETE /api/sfa/expense-settings/routes/[id]
 * Delete an expense route
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  await connectToDatabase();

  const route = await ExpenseRouteModel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
