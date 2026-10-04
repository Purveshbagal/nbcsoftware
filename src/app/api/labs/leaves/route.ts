import { employeeCollectionRoutes } from "@/lib/labs-crud";
import LeaveModel from "@/models/Leave";

/** Calendar days from `from` to `to`, inclusive. */
function daysBetween(from: string, to: string) {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86_400_000) + 1;
}

export const { GET, POST } = employeeCollectionRoutes(() => LeaveModel, {
  label: "Leave",
  required: ["leaveType", "fromDate", "toDate"],
  sort: { fromDate: -1 },
  defaults: { status: "pending" },
  filters: { status: "status" },
  fields: {
    leaveType: "string",
    reason: "string",
    fromDate: "string",
    toDate: "string",
    days: "number",
  },
  prepare(doc) {
    const span = daysBetween(String(doc.fromDate), String(doc.toDate));
    if (span === null) throw new Error("The leave must end on or after the day it starts");
    // Half-day leave is sent as 0.5; anything else is the span of the dates.
    if (doc.days !== 0.5) doc.days = span;
  },
});
