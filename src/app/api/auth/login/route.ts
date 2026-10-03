import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import UserModel from "@/models/User";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ username: String(username).toLowerCase().trim() });
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (user.isActive === false) {
    return NextResponse.json({ error: "This account has been deactivated" }, { status: 403 });
  }

  const token = await createSession({
    userId: user._id.toString(),
    username: user.username,
    name: user.name,
    role: user.role === "field" ? "field" : "admin",
  });

  return NextResponse.json({
    ok: true,
    token,
    user: { username: user.username, name: user.name, role: user.role },
  });
}
