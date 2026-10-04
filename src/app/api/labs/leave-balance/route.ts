import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import EntitlementModel from "@/models/Entitlement";
import LeaveModel from "@/models/Leave";

type EntitlementLean = {
  leaveType: string;
  employeeName?: string;
  entitledDays?: number;
  carryForward?: number;
};

/**
 * Leave balance per type for the current year. A personal entitlement wins
 * over one set for the employee's designation.
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const year = istDateKey().slice(0, 4);

  const [entitlements, leaves] = await Promise.all([
    EntitlementModel.find({
      isActive: { $ne: false },
      $and: [
        { $or: [{ year }, { year: "" }, { year: { $exists: false } }] },
        {
          $or: [
            { employeeName: employee.name },
            ...(employee.designation
              ? [{ designation: employee.designation, employeeName: { $in: ["", null] } }]
              : []),
          ],
        },
      ],
    }).lean<EntitlementLean[]>(),
    LeaveModel.find({
      employeeName: employee.name,
      status: { $in: ["approved", "pending"] },
      fromDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    })
      .select("leaveType days status")
      .lean<{ leaveType?: string; days?: number; status: string }[]>(),
  ]);

  const byType = new Map<string, { entitled: number; personal: boolean }>();
  for (const row of entitlements) {
    const personal = row.employeeName === employee.name;
    const current = byType.get(row.leaveType);
    if (current?.personal && !personal) continue;
    byType.set(row.leaveType, {
      entitled: (row.entitledDays ?? 0) + (row.carryForward ?? 0),
      personal,
    });
  }

  const usage = new Map<string, { used: number; pending: number }>();
  for (const leave of leaves) {
    const type = leave.leaveType || "Other";
    const entry = usage.get(type) ?? { used: 0, pending: 0 };
    if (leave.status === "approved") entry.used += leave.days ?? 0;
    else entry.pending += leave.days ?? 0;
    usage.set(type, entry);
  }

  const types = new Set([...byType.keys(), ...usage.keys()]);
  const items = [...types].sort().map((leaveType) => {
    const entitled = byType.get(leaveType)?.entitled ?? 0;
    const { used, pending } = usage.get(leaveType) ?? { used: 0, pending: 0 };
    return { leaveType, entitled, used, pending, available: Math.max(0, entitled - used - pending) };
  });

  return NextResponse.json({ year, items });
}
