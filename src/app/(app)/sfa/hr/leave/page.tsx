import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import LeaveModel from "@/models/Leave";

const columns: Column[] = [
  { key: "employeeName", label: "Employee" },
  { key: "leaveType", label: "Leave Type" },
  { key: "fromDate", label: "From", type: "date" },
  { key: "toDate", label: "To", type: "date" },
  { key: "days", label: "Days", type: "number" },
  { key: "reason", label: "Reason", secondary: true },
  { key: "zone", label: "Zone", secondary: true },
  { key: "reviewedBy", label: "Reviewed By", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function LeaveManagementPage() {
  await connectToDatabase();

  const [docs, masters, employees] = await Promise.all([
    LeaveModel.find({}).sort({ fromDate: -1 }).lean(),
    loadMasterOptions(["zone", "leave-reason"]),
    loadEmployeeNames(),
  ]);

  const fields: Field[] = [
    { key: "employeeName", label: "Employee", type: "select", options: employees, required: true },
    { key: "zone", label: "Zone", type: "select", options: masters.zone },
    {
      key: "leaveType",
      label: "Leave Type",
      type: "select",
      options: ["Casual", "Sick", "Earned", "Unpaid", "Compensatory"],
    },
    {
      key: "reason",
      label: "Reason",
      type: "select",
      options: masters["leave-reason"],
    },
    { key: "fromDate", label: "From Date", type: "date", required: true },
    { key: "toDate", label: "To Date", type: "date", required: true },
    { key: "days", label: "Days", type: "number" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["pending", "approved", "rejected"],
    },
    { key: "reviewedBy", label: "Reviewed By" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Leave Management"
        description="Applications from the field team, and the decision taken on each."
      />
      <EntityTable
        endpoint="/api/sfa/leaves"
        entityName="Leave"
        labelKey="employeeName"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: ["pending", "approved", "rejected"] },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "employeeName", label: "Employee", options: employees },
        ]}
      />
    </div>
  );
}
