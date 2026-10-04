import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import ReminderModel from "@/models/Reminder";

/** Tick a reminder off, or reopen it. Only the assignee may. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const status = body?.status === "done" ? "done" : "open";

  const item = await ReminderModel.findOneAndUpdate(
    { _id: id, assignedTo: auth.employee.name },
    { status },
    { returnDocument: "after" }
  ).lean();

  if (!item) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}
