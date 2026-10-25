import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import UserModel from "@/models/User";

/**
 * GET budget information for current user
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ username: session.username })
    .select("budgetLimit")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const budget = user.budgetLimit || {
    totalLimit: 0,
    spentAmount: 0,
    availableAmount: 0,
  };

  return NextResponse.json({ budget });
}

/**
 * UPDATE budget limit for a user (admin only)
 */
export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as
    | { username?: string; totalLimit?: number }
    | null;

  if (!body?.username || typeof body.totalLimit !== "number") {
    return NextResponse.json(
      { error: "username and totalLimit are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ username: body.username });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const currentSpent = user.budgetLimit?.spentAmount || 0;

  user.budgetLimit = {
    totalLimit: body.totalLimit,
    spentAmount: currentSpent,
    availableAmount: body.totalLimit - currentSpent,
  };

  await user.save();

  return NextResponse.json({ budget: user.budgetLimit });
}
