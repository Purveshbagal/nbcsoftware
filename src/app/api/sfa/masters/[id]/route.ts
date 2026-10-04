import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { serializeMasterItem } from "@/lib/serialize-master";
import MasterItemModel from "@/models/MasterItem";

const EDITABLE = ["name", "code", "description", "parent"] as const;

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
  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  for (const field of EDITABLE) {
    if (typeof body[field] === "string") {
      update[field] = body[field].trim();
    }
  }
  if (body.value !== undefined) {
    update.value = body.value === "" || body.value === null ? null : Number(body.value);
  }
  if (body.sortOrder !== undefined) {
    update.sortOrder = Number(body.sortOrder) || 0;
  }
  if (typeof body.isActive === "boolean") {
    update.isActive = body.isActive;
  }

  if (update.name === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectToDatabase();

  const current = await MasterItemModel.findById(id);
  if (!current) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (typeof update.name === "string" && update.name !== current.name) {
    const clash = await MasterItemModel.findOne({
      type: current.type,
      name: update.name,
      _id: { $ne: id },
    });
    if (clash) {
      return NextResponse.json(
        { error: `"${update.name}" already exists in this list` },
        { status: 409 }
      );
    }
  }

  const item = await MasterItemModel.findByIdAndUpdate(id, update, {
    returnDocument: "after",
  });

  return NextResponse.json({ item: serializeMasterItem(item.toObject()) });
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

  await connectToDatabase();

  const item = await MasterItemModel.findByIdAndDelete(id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
