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

  const { username, name, password, budgetLimit } = await request.json();

  if (!username || !name || !password) {
    return NextResponse.json(
      { error: "Username, name and password are required" },
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

  const userData: any = {
    username: normalizedUsername,
    name,
    password: hashed,
    role: "field",
  };

  if (budgetLimit !== undefined && budgetLimit !== "") {
    const limitAmount = Number(budgetLimit);
    userData.budgetLimit = {
      totalLimit: limitAmount,
      spentAmount: 0,
      availableAmount: limitAmount,
    };
  }

  const user = await UserModel.create(userData);

  return NextResponse.json(
    {
      user: {
        _id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    },
    { status: 201 }
  );
}
