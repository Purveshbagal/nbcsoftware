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
  { key: "visitDate", label: "Date" },
  { key: "doctorCalls", label: "Doctor calls", numeric: true },
  { key: "firmCalls", label: "Firm calls", numeric: true },
  { key: "closed", label: "Closed", numeric: true },
  { key: "total", label: "Total", numeric: true },
  { key: "pob", label: "POB value (₹)", numeric: true },
];

export default async function DailyCallReportPage({
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
      doctorCalls: number;
      firmCalls: number;
      closed: number;
      pob: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$visitDate",
          doctorCalls: { $sum: { $cond: [{ $eq: ["$visitType", "doctor"] }, 1, 0] } },
          firmCalls: { $sum: { $cond: [{ $eq: ["$visitType", "firm"] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          pob: { $sum: { $ifNull: ["$pobValue", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((day) => ({
    visitDate: day._id,
    doctorCalls: day.doctorCalls,
    firmCalls: day.firmCalls,
    closed: day.closed,
    total: day.doctorCalls + day.firmCalls,
    pob: day.pob.toLocaleString("en-IN"),
  }));

  const totals = grouped.reduce(
    (acc, day) => ({
      doctorCalls: acc.doctorCalls + day.doctorCalls,
      firmCalls: acc.firmCalls + day.firmCalls,
      closed: acc.closed + day.closed,
      pob: acc.pob + day.pob,
    }),
    { doctorCalls: 0, firmCalls: 0, closed: 0, pob: 0 }
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/reports" />}>
        <ArrowLeft />
        All reports
      </Button>
      <PageHeader
        title="All India Daily Call Report"
        description="Calls per day across every zone and division."
      />
      <ReportView
        title="All India Daily Call Report"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          visitDate: "Total",
          doctorCalls: totals.doctorCalls,
          firmCalls: totals.firmCalls,
          closed: totals.closed,
          total: totals.doctorCalls + totals.firmCalls,
          pob: totals.pob.toLocaleString("en-IN"),
        }}
      />
    </div>
  );
}
