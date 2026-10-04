import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { Button } from "@/components/ui/button";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import VisitModel from "@/models/Visit";

const columns = [
  { key: "employeeName", label: "Employee" },
  { key: "closed", label: "Closed", numeric: true },
  { key: "skipped", label: "Skipped", numeric: true },
  { key: "open", label: "Open", numeric: true },
  { key: "planned", label: "Planned", numeric: true },
  { key: "total", label: "Total calls", numeric: true },
  { key: "pob", label: "POB value (₹)", numeric: true },
];

export default async function CallReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const match: Record<string, unknown> = { visitDate: { $gte: from, $lte: to } };
  if (employee) match.employeeName = employee;

  const [grouped, employees] = await Promise.all([
    VisitModel.aggregate<{
      _id: string;
      closed: number;
      skipped: number;
      open: number;
      planned: number;
      pob: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ["$employeeName", "(unassigned)"] },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          skipped: { $sum: { $cond: [{ $eq: ["$status", "skipped"] }, 1, 0] } },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          planned: { $sum: { $cond: [{ $eq: ["$status", "planned"] }, 1, 0] } },
          pob: { $sum: { $ifNull: ["$pobValue", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((group) => ({
    employeeName: group._id,
    closed: group.closed,
    skipped: group.skipped,
    open: group.open,
    planned: group.planned,
    total: group.closed + group.skipped + group.open + group.planned,
    pob: group.pob.toLocaleString("en-IN"),
  }));

  const totals = grouped.reduce(
    (acc, group) => ({
      closed: acc.closed + group.closed,
      skipped: acc.skipped + group.skipped,
      open: acc.open + group.open,
      planned: acc.planned + group.planned,
      pob: acc.pob + group.pob,
    }),
    { closed: 0, skipped: 0, open: 0, planned: 0, pob: 0 }
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/reports" />}>
        <ArrowLeft />
        All reports
      </Button>
      <PageHeader
        title="Call Report"
        description="Closed, skipped and open calls per employee for the selected period."
      />
      <ReportView
        title="Call Report"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          employeeName: "Total",
          closed: totals.closed,
          skipped: totals.skipped,
          open: totals.open,
          planned: totals.planned,
          total: totals.closed + totals.skipped + totals.open + totals.planned,
          pob: totals.pob.toLocaleString("en-IN"),
        }}
      />
    </div>
  );
}
