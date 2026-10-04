import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import ReminderModel from "@/models/Reminder";

/** Reminders and tasks an administrator assigned to this employee. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const items = await ReminderModel.find({ assignedTo: auth.employee.name })
    .sort({ status: -1, date: 1 })
    .limit(200)
    .lean();

  return NextResponse.json({ items });
}
