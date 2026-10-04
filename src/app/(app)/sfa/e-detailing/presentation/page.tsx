import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import MediaAssetModel from "@/models/MediaAsset";

const columns: Column[] = [
  { key: "title", label: "Title" },
  { key: "fileType", label: "File Type" },
  { key: "division", label: "Division" },
  { key: "campaign", label: "Campaign" },
  { key: "url", label: "Link", secondary: true },
  { key: "description", label: "Description", secondary: true },
  { key: "createdAt", label: "Added", type: "date", secondary: true },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function MediaPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    MediaAssetModel.find({ kind: "presentation" }).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["division", "campaign"]),
  ]);

  const fields: Field[] = [
    { key: "title", label: "Title", required: true, wide: true },
    { key: "url", label: "Link", wide: true, placeholder: "Where the file is hosted" },
    { key: "fileType", label: "File Type", type: "select", options: ["PDF", "Image", "Video", "Slides", "Other"] },
    { key: "division", label: "Division", type: "select", options: masters.division },
    { key: "campaign", label: "Campaign", type: "select", options: masters.campaign },
    { key: "isActive", label: "Active", type: "checkbox" },
    { key: "description", label: "Description", type: "textarea", wide: true },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Presentation" description="Decks the team details from on a call." />
      <EntityTable
        endpoint="/api/sfa/media"
        entityName="Item"
        labelKey="title"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        defaults={{ kind: "presentation" }}
        filters={[
          { key: "division", label: "Division", options: masters.division },
          { key: "campaign", label: "Campaign", options: masters.campaign },
        ]}
      />
    </div>
  );
}
