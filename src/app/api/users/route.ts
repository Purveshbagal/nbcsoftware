import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const users = await UserModel.find({ role: "field" })
    .select("-password")
    .sort({ createdAt: -1 });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, name, mobileNumber, password, budgetLimit } = await request.json();

  if (!username || !name || !password) {
    return NextResponse.json(
      { error: "Username, name and password are required" },
      { status: 400 }
    );
  }

  if (mobileNumber !== undefined && typeof mobileNumber !== "string") {
    return NextResponse.json(
      { error: "Mobile number must be a 10-digit number" },
      { status: 400 }
    );
  }

  const normalizedMobileNumber = mobileNumber?.trim() ?? "";
  if (
    mobileNumber !== undefined &&
    normalizedMobileNumber !== "" &&
    !/^[0-9]{10}$/.test(normalizedMobileNumber)
  ) {
    return NextResponse.json(
      { error: "Mobile number must be a 10-digit number" },
      { status: 400 }
    );
  }

  if (budgetLimit !== undefined && (isNaN(Number(budgetLimit)) || Number(budgetLimit) < 0)) {
    return NextResponse.json(
      { error: "Budget limit must be a valid positive number" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const normalizedUsername = String(username).toLowerCase().trim();

  const existing = await UserModel.findOne({ username: normalizedUsername });
  if (existing) {
    return NextResponse.json(
      { error: "That username is already taken" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const userData = {
    username: normalizedUsername,
    name,
    password: hashed,
    role: "field" as const,
    ...(normalizedMobileNumber ? { mobileNumber: normalizedMobileNumber } : {}),
    ...(budgetLimit !== undefined && budgetLimit !== ""
      ? {
          budgetLimit: {
            totalLimit: Number(budgetLimit),
            spentAmount: 0,
            availableAmount: Number(budgetLimit),
          },
        }
      : {}),
  };

  const user = await UserModel.create(userData);

  return NextResponse.json(
    {
      user: {
        _id: user._id.toString(),
        username: user.username,
        name: user.name,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    },
    { status: 201 }
  );
}
