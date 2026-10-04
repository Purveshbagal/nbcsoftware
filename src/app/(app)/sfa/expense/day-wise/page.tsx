import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import ExpenseModel from "@/models/Expense";

const columns = [
  { key: "expenseDate", label: "Date" },
  { key: "employeeName", label: "Employee" },
  { key: "claims", label: "Claims", numeric: true },
  { key: "distance", label: "Distance (Km)", numeric: true },
  { key: "fare", label: "Fare (₹)", numeric: true },
  { key: "other", label: "Other (₹)", numeric: true },
  { key: "total", label: "Total (₹)", numeric: true },
];

export default async function DayWiseExpensePage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const match: Record<string, unknown> = { expenseDate: { $gte: from, $lte: to } };
  if (employee) match.employeeName = employee;

  const [grouped, employees] = await Promise.all([
    ExpenseModel.aggregate<{
      _id: { date: string; employeeName: string };
      claims: number;
      distance: number;
      fare: number;
      other: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: {
            date: "$expenseDate",
            employeeName: { $ifNull: ["$employeeName", "(unassigned)"] },
          },
          claims: { $sum: 1 },
          distance: { $sum: { $ifNull: ["$distanceKm", 0] } },
          fare: { $sum: { $ifNull: ["$fare", 0] } },
          other: { $sum: { $ifNull: ["$otherAmount", 0] } },
        },
      },
      { $sort: { "_id.date": 1, "_id.employeeName": 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((group) => ({
    expenseDate: group._id.date,
    employeeName: group._id.employeeName,
    claims: group.claims,
    distance: group.distance,
    fare: group.fare.toLocaleString("en-IN"),
    other: group.other.toLocaleString("en-IN"),
    total: (group.fare + group.other).toLocaleString("en-IN"),
  }));

  const totals = grouped.reduce(
    (acc, group) => ({
      claims: acc.claims + group.claims,
      distance: acc.distance + group.distance,
      fare: acc.fare + group.fare,
      other: acc.other + group.other,
    }),
    { claims: 0, distance: 0, fare: 0, other: 0 }
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Day wise expense"
        description="Claims rolled up per day and employee for the selected period."
      />
      <ReportView
        title="Day wise expense"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          expenseDate: "Total",
          employeeName: "",
          claims: totals.claims,
          distance: totals.distance,
          fare: totals.fare.toLocaleString("en-IN"),
          other: totals.other.toLocaleString("en-IN"),
          total: (totals.fare + totals.other).toLocaleString("en-IN"),
        }}
      />
    </div>
  );
}
