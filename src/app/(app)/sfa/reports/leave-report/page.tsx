import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { Button } from "@/components/ui/button";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import LeaveModel from "@/models/Leave";

const columns = [
  { key: "employeeName", label: "Employee" },
  { key: "leaveType", label: "Leave type" },
  { key: "applications", label: "Applications", numeric: true },
  { key: "approvedDays", label: "Approved days", numeric: true },
  { key: "pendingDays", label: "Pending days", numeric: true },
  { key: "rejectedDays", label: "Rejected days", numeric: true },
];

export default async function LeaveReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  // A leave counts if any part of it overlaps the selected window.
  const match: Record<string, unknown> = {
    fromDate: { $lte: to },
    toDate: { $gte: from },
  };
  if (employee) match.employeeName = employee;

  const days = { $ifNull: ["$days", 0] };

  const [grouped, employees] = await Promise.all([
    LeaveModel.aggregate<{
      _id: { employeeName: string; leaveType: string };
      applications: number;
      approvedDays: number;
      pendingDays: number;
      rejectedDays: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: {
            employeeName: { $ifNull: ["$employeeName", "(unassigned)"] },
            leaveType: { $ifNull: ["$leaveType", "(unspecified)"] },
          },
          applications: { $sum: 1 },
          approvedDays: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, days, 0] } },
          pendingDays: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, days, 0] } },
          rejectedDays: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, days, 0] } },
        },
      },
      { $sort: { "_id.employeeName": 1, "_id.leaveType": 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((group) => ({
    employeeName: group._id.employeeName,
    leaveType: group._id.leaveType,
    applications: group.applications,
    approvedDays: group.approvedDays,
    pendingDays: group.pendingDays,
    rejectedDays: group.rejectedDays,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/reports" />}>
        <ArrowLeft />
        All reports
      </Button>
      <PageHeader
        title="Leave Report"
        description="Leave overlapping the selected window, by employee and type."
      />
      <ReportView
        title="Leave Report"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
      />
    </div>
  );
}
