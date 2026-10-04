import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import EmployeeModel from "@/models/Employee";

const columns: Column[] = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "division", label: "Division/Department" },
  { key: "zone", label: "Zone" },
  { key: "contactNo", label: "Contact" },
  { key: "email", label: "Email", secondary: true },
  { key: "city", label: "City", secondary: true },
  { key: "state", label: "State", secondary: true },
  { key: "reportingTo", label: "Reports To", secondary: true },
  { key: "workType", label: "Work Type", secondary: true },
  { key: "dateOfJoin", label: "Date Of Join", secondary: true },
  { key: "dateOfResignation", label: "Resigned On", secondary: true },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function EmployeesPage() {
  await connectToDatabase();

  const [docs, masters, seniors] = await Promise.all([
    EmployeeModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["division", "zone", "designation"]),
    loadEmployeeNames(),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "code", label: "Employee Code", section: "Basic information" },
    { key: "name", label: "Name", required: true, section: "Basic information" },
    { key: "email", label: "Email", type: "email", section: "Basic information" },
    { key: "contactNo", label: "Contact", type: "tel", section: "Basic information" },
    { key: "dateOfBirth", label: "Date Of Birth", type: "date", section: "Basic information" },
    { key: "dateOfJoin", label: "Date Of Join", type: "date", section: "Basic information" },

    {
      key: "designation",
      label: "Designation",
      type: "select",
      options: masters.designation,
      section: "Work information",
    },
    {
      key: "division",
      label: "Division/Department",
      type: "select",
      options: masters.division,
      section: "Work information",
    },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Work information" },
    {
      key: "workType",
      label: "Work Type",
      type: "select",
      options: ["Field", "Office", "Hybrid"],
      section: "Work information",
    },
    {
      key: "reportingTo",
      label: "Reports To",
      type: "select",
      options: seniors,
      section: "Work information",
    },
    { key: "assignTo", label: "Assign To", section: "Work information" },

    { key: "city", label: "City", section: "Address" },
    { key: "state", label: "State", section: "Address" },
    { key: "address", label: "Address", type: "textarea", wide: true, section: "Address" },

    { key: "dateOfResignation", label: "Date Of Resignation", type: "date", section: "Exit" },
    { key: "inactiveDate", label: "Inactive Date", type: "date", section: "Exit" },
    { key: "inactiveReason", label: "Inactive Reason", type: "textarea", wide: true, section: "Exit" },
    { key: "isActive", label: "Active", type: "checkbox", section: "Exit" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Employees"
        description="Field and office staff. 'Reports To' builds the reporting hierarchy used across approvals."
      />
      <EntityTable
        endpoint="/api/sfa/employees"
        entityName="Employee"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "division", label: "Division", options: masters.division },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "designation", label: "Designation", options: masters.designation },
        ]}
      />
    </div>
  );
}
