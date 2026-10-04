import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { Button } from "@/components/ui/button";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import ExpenseModel from "@/models/Expense";

const columns = [
  { key: "employeeName", label: "Employee" },
  { key: "head", label: "Head" },
  { key: "claims", label: "Claims", numeric: true },
  { key: "pending", label: "Pending (₹)", numeric: true },
  { key: "approved", label: "Approved (₹)", numeric: true },
  { key: "rejected", label: "Rejected (₹)", numeric: true },
  { key: "total", label: "Total (₹)", numeric: true },
];

export default async function ExpenseReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const match: Record<string, unknown> = { expenseDate: { $gte: from, $lte: to } };
  if (employee) match.employeeName = employee;

  const amount = { $add: [{ $ifNull: ["$fare", 0] }, { $ifNull: ["$otherAmount", 0] }] };

  const [grouped, employees] = await Promise.all([
    ExpenseModel.aggregate<{
      _id: { employeeName: string; head: string };
      claims: number;
      pending: number;
      approved: number;
      rejected: number;
      total: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: {
            employeeName: { $ifNull: ["$employeeName", "(unassigned)"] },
            head: { $ifNull: ["$head", "(no head)"] },
          },
          claims: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, amount, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, amount, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, amount, 0] } },
          total: { $sum: amount },
        },
      },
      { $sort: { "_id.employeeName": 1, "_id.head": 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((group) => ({
    employeeName: group._id.employeeName,
    head: group._id.head,
    claims: group.claims,
    pending: group.pending.toLocaleString("en-IN"),
    approved: group.approved.toLocaleString("en-IN"),
    rejected: group.rejected.toLocaleString("en-IN"),
    total: group.total.toLocaleString("en-IN"),
  }));

  const totals = grouped.reduce(
    (acc, group) => ({
      claims: acc.claims + group.claims,
      pending: acc.pending + group.pending,
      approved: acc.approved + group.approved,
      rejected: acc.rejected + group.rejected,
      total: acc.total + group.total,
    }),
    { claims: 0, pending: 0, approved: 0, rejected: 0, total: 0 }
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/reports" />}>
        <ArrowLeft />
        All reports
      </Button>
      <PageHeader
        title="Expense Report"
        description="Claims by employee and head, split by approval state."
      />
      <ReportView
        title="Expense Report"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          employeeName: "Total",
          head: "",
          claims: totals.claims,
          pending: totals.pending.toLocaleString("en-IN"),
          approved: totals.approved.toLocaleString("en-IN"),
          rejected: totals.rejected.toLocaleString("en-IN"),
          total: totals.total.toLocaleString("en-IN"),
        }}
      />
    </div>
  );
}
