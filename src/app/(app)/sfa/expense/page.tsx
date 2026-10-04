import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import ExpenseModel from "@/models/Expense";

const columns: Column[] = [
  { key: "expenseDate", label: "Date", type: "date" },
  { key: "employeeName", label: "Employee" },
  { key: "head", label: "Head" },
  { key: "modeOfTravel", label: "Mode", secondary: true },
  { key: "fromCity", label: "From", secondary: true },
  { key: "toCity", label: "To", secondary: true },
  { key: "distanceKm", label: "Distance (Km)", type: "number", secondary: true },
  { key: "fare", label: "Fare", type: "currency" },
  { key: "otherAmount", label: "Other", type: "currency", secondary: true },
  { key: "zone", label: "Zone", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function ExpensePage() {
  await connectToDatabase();

  const [docs, masters, employees] = await Promise.all([
    ExpenseModel.find({}).sort({ expenseDate: -1 }).lean(),
    loadMasterOptions(["zone", "division", "expense-head", "mode-of-travel"]),
    loadEmployeeNames(),
  ]);

  const rows = toPlainRows(docs);

  const totals = rows.reduce(
    (acc, row) => {
      const amount = Number(row.fare ?? 0) + Number(row.otherAmount ?? 0);
      acc.all += amount;
      if (row.status === "pending") acc.pending += amount;
      if (row.status === "approved") acc.approved += amount;
      return acc;
    },
    { all: 0, pending: 0, approved: 0 }
  );

  const fields: Field[] = [
    { key: "employeeName", label: "Employee", type: "select", options: employees, required: true, section: "Claim" },
    { key: "expenseDate", label: "Date", type: "date", required: true, section: "Claim" },
    { key: "head", label: "Expense Head", type: "select", options: masters["expense-head"], section: "Claim" },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Claim" },
    { key: "division", label: "Division", type: "select", options: masters.division, section: "Claim" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["pending", "approved", "rejected"],
      section: "Claim",
    },

    {
      key: "modeOfTravel",
      label: "Mode Of Travel",
      type: "select",
      options: masters["mode-of-travel"],
      section: "Travel",
    },
    { key: "fromCity", label: "From City", section: "Travel" },
    { key: "toCity", label: "To City", section: "Travel" },
    { key: "distanceKm", label: "Distance (Km)", type: "number", section: "Travel" },
    { key: "fare", label: "Fare (₹)", type: "number", section: "Travel" },
    { key: "otherAmount", label: "Other Amount (₹)", type: "number", section: "Travel" },
    { key: "remarks", label: "Remarks", type: "textarea", wide: true, section: "Travel" },
  ];

  const summary = [
    { label: "Total claimed", value: totals.all, tone: "bg-blue-50 text-blue-700" },
    { label: "Pending approval", value: totals.pending, tone: "bg-amber-50 text-amber-700" },
    { label: "Approved", value: totals.approved, tone: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Expenses"
        description="Travel and other claims raised by the field team, with their approval state."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label} className="py-5">
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
                ₹{item.value.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <EntityTable
        endpoint="/api/sfa/expenses"
        entityName="Expense"
        labelKey="employeeName"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: ["pending", "approved", "rejected"] },
          { key: "head", label: "Head", options: masters["expense-head"] },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "employeeName", label: "Employee", options: employees },
        ]}
      />
    </div>
  );
}
