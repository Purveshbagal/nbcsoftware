import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { serializeMasterItem } from "@/lib/serialize-master";
import { findMasterType } from "@/lib/workspaces";
import MasterItemModel from "@/models/MasterItem";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type");
  if (!type || !findMasterType(type)) {
    return NextResponse.json({ error: "Unknown master type" }, { status: 400 });
  }

  await connectToDatabase();

  const items = await MasterItemModel.find({ type })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return NextResponse.json({ items: items.map(serializeMasterItem) });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const type = String(body.type ?? "").trim();
  const name = String(body.name ?? "").trim();

  if (!findMasterType(type)) {
    return NextResponse.json({ error: "Unknown master type" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await MasterItemModel.findOne({ type, name });
  if (existing) {
    return NextResponse.json(
      { error: `"${name}" already exists in this list` },
      { status: 409 }
    );
  }

  const item = await MasterItemModel.create({
    type,
    name,
    code: String(body.code ?? "").trim(),
    description: String(body.description ?? "").trim(),
    value: body.value === "" || body.value === null || body.value === undefined
      ? undefined
      : Number(body.value),
    parent: String(body.parent ?? "").trim(),
    sortOrder: Number(body.sortOrder ?? 0) || 0,
    isActive: body.isActive !== false,
    createdBy: { username: session.username, name: session.name },
  });

  return NextResponse.json(
    { item: serializeMasterItem(item.toObject()) },
    { status: 201 }
  );
}
