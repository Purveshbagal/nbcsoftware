import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import VisitModel from "@/models/Visit";

const columns = [
  { key: "firm", label: "Firm" },
  { key: "calls", label: "Calls", numeric: true },
  { key: "closed", label: "Closed calls", numeric: true },
  { key: "pob", label: "POB value (₹)", numeric: true },
  { key: "lastCall", label: "Last call" },
];

export default async function FirmBusinessPage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const match: Record<string, unknown> = {
    visitType: "firm",
    visitDate: { $gte: from, $lte: to },
  };
  if (employee) match.employeeName = employee;

  const [grouped, employees] = await Promise.all([
    VisitModel.aggregate<{
      _id: string;
      calls: number;
      closed: number;
      pob: number;
      lastCall: string;
    }>([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ["$firm", "(unnamed)"] },
          calls: { $sum: 1 },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          pob: { $sum: { $ifNull: ["$pobValue", 0] } },
          lastCall: { $max: "$visitDate" },
        },
      },
      { $sort: { pob: -1, _id: 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((group) => ({
    firm: group._id,
    calls: group.calls,
    closed: group.closed,
    pob: group.pob.toLocaleString("en-IN"),
    lastCall: group.lastCall ?? "",
  }));

  const total = grouped.reduce((sum, group) => sum + group.pob, 0);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Firm Business"
        description="Business booked against each firm in the selected period, highest first."
      />
      <ReportView
        title="Firm Business"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          firm: "Total",
          calls: grouped.reduce((sum, group) => sum + group.calls, 0),
          closed: grouped.reduce((sum, group) => sum + group.closed, 0),
          pob: total.toLocaleString("en-IN"),
          lastCall: "",
        }}
      />
    </div>
  );
}
