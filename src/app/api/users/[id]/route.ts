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
  const { isActive, name, mobileNumber, password, budgetLimit } = await request.json();

  await connectToDatabase();
  const currentUser = await UserModel.findById(id);
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (typeof isActive === "boolean" && currentUser.isActive !== isActive) {
    update.isActive = isActive;
  }
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const normalizedName = name.trim();
    if (normalizedName !== currentUser.name) {
      update.name = normalizedName;
    }
  }
  if (mobileNumber !== undefined) {
    if (typeof mobileNumber !== "string") {
      return NextResponse.json(
        { error: "Mobile number must be a 10-digit number" },
        { status: 400 }
      );
    }

    const normalizedMobileNumber = mobileNumber.trim();
    if (normalizedMobileNumber && !/^[0-9]{10}$/.test(normalizedMobileNumber)) {
      return NextResponse.json(
        { error: "Mobile number must be a 10-digit number" },
        { status: 400 }
      );
    }

    if ((currentUser.mobileNumber || "") !== normalizedMobileNumber) {
      update.mobileNumber = normalizedMobileNumber;
    }
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

    const limitAmount = Number(budgetLimit);
    const spentAmount = currentUser.budgetLimit?.spentAmount || 0;

    if ((currentUser.budgetLimit?.totalLimit ?? 0) !== limitAmount) {
      update.budgetLimit = {
        totalLimit: limitAmount,
        spentAmount: spentAmount,
        availableAmount: limitAmount - spentAmount,
        updatedAt: new Date(),
        updatedBy: session.username,
      };
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

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
