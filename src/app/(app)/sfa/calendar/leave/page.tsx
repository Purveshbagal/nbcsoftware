import Link from "next/link";

import { LeaveCalendar, type CalendarEntry } from "@/components/sfa/leave-calendar";
import { PageHeader } from "@/components/sfa/page-header";
import { Button } from "@/components/ui/button";
import { connectToDatabase } from "@/lib/mongodb";
import HolidayModel from "@/models/Holiday";
import LeaveModel from "@/models/Leave";

type LeanLeave = {
  _id: { toString(): string };
  employeeName: string;
  leaveType?: string;
  status?: string;
  fromDate: string;
  toDate: string;
};

type LeanHoliday = {
  _id: { toString(): string };
  calendarType?: string;
  occasion?: string;
  zone?: string;
  employeeName?: string;
  date: string;
};

export default async function LeaveCalendarPage() {
  await connectToDatabase();

  const [leaves, calendar] = await Promise.all([
    LeaveModel.find({ status: { $ne: "rejected" } }).lean<LeanLeave[]>(),
    HolidayModel.find({}).lean<LeanHoliday[]>(),
  ]);

  const entries: CalendarEntry[] = [
    ...leaves.map((leave) => ({
      _id: leave._id.toString(),
      label: leave.employeeName,
      detail: `${leave.leaveType ?? "Leave"} (${leave.status ?? "pending"})`,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      tone: "leave" as const,
    })),
    ...calendar.map((entry) => ({
      _id: entry._id.toString(),
      label: entry.occasion || (entry.calendarType === "work" ? "Working day" : "Holiday"),
      detail: entry.employeeName || entry.zone || "",
      fromDate: entry.date,
      toDate: entry.date,
      tone: entry.calendarType === "work" ? ("work" as const) : ("holiday" as const),
    })),
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Leave Calendar"
        description="Approved and pending leave alongside the holiday and work calendar."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/sfa/hr/leave" />}>
            Manage leave
          </Button>
        }
      />
      <LeaveCalendar entries={entries} />
    </div>
  );
}
