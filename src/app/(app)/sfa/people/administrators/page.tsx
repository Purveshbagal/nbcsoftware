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
    loadMasterOptions(["division", "zone", "state", "district", "taluka", "village"]),
  ]);

  const fields: Field[] = [
    { key: "name", label: "Name", required: true, section: "Basic information" },
    { key: "email", label: "Email", type: "email", section: "Basic information" },
    { key: "contactNo", label: "Contact", type: "tel", section: "Basic information" },
    { key: "division", label: "Division", type: "select", options: masters.division, section: "Work information" },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Work information" },
    {
      key: "adminType",
      label: "Admin Type",
      type: "select",
      options: ["Super Admin", "Admin", "Manager", "Viewer"],
      section: "Work information",
    },
    {
      key: "state",
      label: "State",
      type: "select",
      options: masters.state || [],
      section: "Address information",
    },
    {
      key: "district",
      label: "District",
      type: "select",
      options: masters.district || [],
      section: "Address information",
    },
    {
      key: "taluka",
      label: "Taluka",
      type: "select",
      options: masters.taluka || [],
      section: "Address information",
    },
    {
      key: "village",
      label: "Village",
      type: "select",
      options: masters.village || [],
      section: "Address information",
    },
    { key: "city", label: "City", section: "Address information" },
    { key: "isActive", label: "Active", type: "checkbox", section: "Status" },
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
