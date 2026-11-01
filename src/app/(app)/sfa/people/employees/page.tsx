import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import EmployeeModel from "@/models/Employee";

const columns: Column[] = [
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "contactNo", label: "Mobile Number" },
];

export default async function EmployeesPage() {
  await connectToDatabase();

  const [docs, masters, seniors] = await Promise.all([
    EmployeeModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["division", "zone", "designation", "state", "district", "taluka", "village"]),
    loadEmployeeNames(),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "name", label: "Name", required: true, section: "Basic information" },
    { key: "contactNo", label: "Mobile Number", type: "tel", required: true, section: "Basic information" },
    {
      key: "designation",
      label: "Designation",
      type: "select",
      options: ["DSO", "FSO", "SFSO", "DSM", "RSM", "ZSM", "NSM"],
      section: "Basic information",
      required: true,
    },
    { key: "email", label: "Email", type: "email", section: "Basic information" },
    { key: "dateOfBirth", label: "Date Of Birth", type: "date", section: "Basic information" },
    { key: "dateOfJoin", label: "Date Of Join", type: "date", section: "Basic information" },
    { key: "city", label: "City", section: "Basic information" },
    {
      key: "appPassword",
      label: "Create Password",
      type: "password",
      placeholder: "Min. 6 characters",
      section: "Mobile App Access",
      required: true,
    },
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
          { key: "division", label: "Division", options: ["PEDIA", "DERMA", ...(masters.division || [])] },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "designation", label: "Designation", options: ["DSO", "FSO", "SFSO", "DSM", "RSM", "ZSM", "NSM", ...(masters.designation || [])] },
        ]}
      />
    </div>
  );
}
