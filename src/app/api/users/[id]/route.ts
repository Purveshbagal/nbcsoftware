import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";

export async function PATCH(
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
  const { isActive, password, budgetLimit } = await request.json();

  const update: Record<string, unknown> = {};
  if (typeof isActive === "boolean") {
    update.isActive = isActive;
  }
  if (password) {
    update.password = await bcrypt.hash(password, 10);
  }
  if (budgetLimit !== undefined) {
    if (isNaN(Number(budgetLimit)) || Number(budgetLimit) < 0) {
      return NextResponse.json(
        { error: "Budget limit must be a valid positive number" },
        { status: 400 }
      );
    }

    // Get current user to preserve spent amount
    await connectToDatabase();
    const currentUser = await UserModel.findById(id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limitAmount = Number(budgetLimit);
    const spentAmount = currentUser.budgetLimit?.spentAmount || 0;

    update.budgetLimit = {
      totalLimit: limitAmount,
      spentAmount: spentAmount,
      availableAmount: limitAmount - spentAmount,
      updatedAt: new Date(),
      updatedBy: session.username,
    };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectToDatabase();

  const user = await UserModel.findByIdAndUpdate(id, update, {
    new: true,
  }).select("-password");

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
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

  if (id === session.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await UserModel.findOneAndDelete({ _id: id, role: "field" });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
