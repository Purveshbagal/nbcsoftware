import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import PresentationModel from "@/models/Presentation";

const columns: Column[] = [
  { key: "coverImage", label: "Image", type: "image" },
  { key: "title", label: "Name" },
  { key: "assigningType", label: "Assigning Type" },
  { key: "assignedTo", label: "Assigning To" },
  { key: "division", label: "Division" },
  { key: "date", label: "Date", type: "date" },
  { key: "description", label: "Description", secondary: true },
];

export default async function PresentationPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    PresentationModel.find().sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["division"]),
  ]);

  const fields: Field[] = [
    { key: "title", label: "Presentation Name", required: true, wide: true },
    {
      key: "assigningType",
      label: "Assigned Type",
      type: "select",
      options: ["Employee", "Doctor"],
      required: true
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      required: true,
      placeholder: "Enter employee or doctor name"
    },
    {
      key: "division",
      label: "Division",
      type: "select",
      options: masters.division,
      required: true
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      wide: true
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Presentation" description="Manage presentations for employees and doctors." />
      <EntityTable
        endpoint="/api/presentations"
        entityName="Presentation"
        labelKey="title"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "division", label: "Division", options: masters.division },
          { key: "assigningType", label: "Assigned Type", options: ["Employee", "Doctor"] },
        ]}
      />
    </div>
  );
}
