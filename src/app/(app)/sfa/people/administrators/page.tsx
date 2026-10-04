import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import AdministratorModel from "@/models/Administrator";

const columns: Column[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "contactNo", label: "Contact" },
  { key: "city", label: "City" },
  { key: "division", label: "Division" },
  { key: "zone", label: "Zone" },
  { key: "adminType", label: "Admin Type" },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function AdministratorsPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    AdministratorModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["division", "zone"]),
  ]);

  const fields: Field[] = [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "contactNo", label: "Contact", type: "tel" },
    { key: "city", label: "City" },
    { key: "division", label: "Division", type: "select", options: masters.division },
    { key: "zone", label: "Zone", type: "select", options: masters.zone },
    {
      key: "adminType",
      label: "Admin Type",
      type: "select",
      options: ["Super Admin", "Admin", "Manager", "Viewer"],
    },
    { key: "isActive", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Administrators"
        description="Back-office users of this workspace and the divisions and zones they cover. Sign-in accounts are managed under the team workspace."
      />
      <EntityTable
        endpoint="/api/sfa/administrators"
        entityName="Administrator"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "division", label: "Division", options: masters.division },
          { key: "zone", label: "Zone", options: masters.zone },
        ]}
      />
    </div>
  );
}
