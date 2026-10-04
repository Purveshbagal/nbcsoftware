import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { Button } from "@/components/ui/button";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import ExpenseModel from "@/models/Expense";
import LeaveModel from "@/models/Leave";
import VisitModel from "@/models/Visit";

const columns = [
  { key: "employeeName", label: "Employee" },
  { key: "calls", label: "Calls", numeric: true },
  { key: "closed", label: "Closed calls", numeric: true },
  { key: "pob", label: "POB value (₹)", numeric: true },
  { key: "leaveDays", label: "Leave days", numeric: true },
  { key: "claims", label: "Claims (₹)", numeric: true },
];

export default async function EmployeePerformancePage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const visitMatch: Record<string, unknown> = { visitDate: { $gte: from, $lte: to } };
  const expenseMatch: Record<string, unknown> = { expenseDate: { $gte: from, $lte: to } };
  const leaveMatch: Record<string, unknown> = {
    fromDate: { $lte: to },
    toDate: { $gte: from },
    status: { $ne: "rejected" },
  };
  if (employee) {
    visitMatch.employeeName = employee;
    expenseMatch.employeeName = employee;
    leaveMatch.employeeName = employee;
  }

  const [visitStats, leaveStats, expenseStats, employees] = await Promise.all([
    VisitModel.aggregate<{ _id: string; calls: number; closed: number; pob: number }>([
      { $match: visitMatch },
      {
        $group: {
          _id: { $ifNull: ["$employeeName", "(unassigned)"] },
          calls: { $sum: 1 },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          pob: { $sum: { $ifNull: ["$pobValue", 0] } },
        },
      },
    ]),
    LeaveModel.aggregate<{ _id: string; days: number }>([
      { $match: leaveMatch },
      { $group: { _id: { $ifNull: ["$employeeName", "(unassigned)"] }, days: { $sum: { $ifNull: ["$days", 0] } } } },
    ]),
    ExpenseModel.aggregate<{ _id: string; amount: number }>([
      { $match: expenseMatch },
      {
        $group: {
          _id: { $ifNull: ["$employeeName", "(unassigned)"] },
          amount: { $sum: { $add: [{ $ifNull: ["$fare", 0] }, { $ifNull: ["$otherAmount", 0] }] } },
        },
      },
    ]),
    loadEmployeeNames(),
  ]);

  const leaveByName = new Map(leaveStats.map((row) => [row._id, row.days]));
  const expenseByName = new Map(expenseStats.map((row) => [row._id, row.amount]));

  // Show every active employee, so a zero row is visible rather than missing.
  const names = new Set<string>([
    ...(employee ? [employee] : employees),
    ...visitStats.map((row) => row._id),
    ...leaveStats.map((row) => row._id),
    ...expenseStats.map((row) => row._id),
  ]);
  const visitByName = new Map(visitStats.map((row) => [row._id, row]));

  const rows: ReportRow[] = [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const visit = visitByName.get(name);
      return {
        employeeName: name,
        calls: visit?.calls ?? 0,
        closed: visit?.closed ?? 0,
        pob: (visit?.pob ?? 0).toLocaleString("en-IN"),
        leaveDays: leaveByName.get(name) ?? 0,
        claims: (expenseByName.get(name) ?? 0).toLocaleString("en-IN"),
      };
    });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/reports" />}>
        <ArrowLeft />
        All reports
      </Button>
      <PageHeader
        title="Employee Daily Performance Report"
        description="Calls, business, leave and claims per employee for the selected period."
      />
      <ReportView
        title="Employee Daily Performance Report"
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
