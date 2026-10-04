import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import EntitlementModel from "@/models/Entitlement";

const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Unpaid", "Compensatory"];

const columns: Column[] = [
  { key: "employeeName", label: "Employee" },
  { key: "designation", label: "Designation" },
  { key: "leaveType", label: "Leave Type" },
  { key: "year", label: "Year" },
  { key: "entitledDays", label: "Entitled Days", type: "number" },
  { key: "carryForward", label: "Carry Forward", type: "number" },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function EntitlementsPage() {
  await connectToDatabase();

  const [docs, masters, employees] = await Promise.all([
    EntitlementModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["designation"]),
    loadEmployeeNames(),
  ]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, index) => String(currentYear - 1 + index));

  const fields: Field[] = [
    {
      key: "employeeName",
      label: "Employee",
      type: "select",
      options: employees,
      placeholder: "Leave blank to set it by designation",
    },
    { key: "designation", label: "Designation", type: "select", options: masters.designation },
    { key: "leaveType", label: "Leave Type", type: "select", options: LEAVE_TYPES, required: true },
    { key: "year", label: "Year", type: "select", options: years },
    { key: "entitledDays", label: "Entitled Days", type: "number" },
    { key: "carryForward", label: "Carry Forward Days", type: "number" },
    { key: "isActive", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Leave Entitlements"
        description="How many days of each leave type an employee — or a whole designation — is entitled to."
      />
      <EntityTable
        endpoint="/api/sfa/entitlements"
        entityName="Entitlement"
        labelKey="leaveType"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "designation", label: "Designation", options: masters.designation },
          { key: "leaveType", label: "Leave Type", options: LEAVE_TYPES },
          { key: "year", label: "Year", options: years },
        ]}
      />
    </div>
  );
}
