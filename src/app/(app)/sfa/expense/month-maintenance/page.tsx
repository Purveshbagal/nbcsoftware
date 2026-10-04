import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import MonthMaintenanceModel from "@/models/MonthMaintenance";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const columns: Column[] = [
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "submitDeadline", label: "Submit Deadline", type: "date" },
  { key: "approvalDeadline", label: "Approval Deadline", type: "date" },
  { key: "isLocked", label: "Locked", type: "bool" },
  { key: "hiddenForEmployee", label: "Hidden For Employee", type: "bool" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, index) => String(currentYear - 2 + index));

const fields: Field[] = [
  { key: "month", label: "Month", type: "select", options: MONTHS, required: true },
  { key: "year", label: "Year", type: "select", options: years, required: true },
  { key: "submitDeadline", label: "Submit Deadline", type: "date" },
  { key: "approvalDeadline", label: "Approval Deadline", type: "date" },
  { key: "isLocked", label: "Lock this month", type: "checkbox" },
  { key: "hiddenForEmployee", label: "Hide from employees", type: "checkbox" },
];

export default async function ExpenseMonthMaintenancePage() {
  await connectToDatabase();

  const docs = await MonthMaintenanceModel.find({ scope: "expense" })
    .sort({ year: -1, month: -1 })
    .lean();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Expense Month Maintenance"
        description="Deadlines for submitting and approving claims, and which months are closed."
      />
      <EntityTable
        endpoint="/api/sfa/month-maintenance"
        entityName="Month"
        labelKey="month"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        defaults={{ scope: "expense" }}
        filters={[{ key: "year", label: "Year", options: years }]}
      />
    </div>
  );
}
