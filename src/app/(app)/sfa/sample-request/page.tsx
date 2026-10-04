import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import SampleRequestModel from "@/models/SampleRequest";

const STATUSES = ["pending", "approved", "denied", "dispatched"];

const columns: Column[] = [
  { key: "requestNo", label: "Request" },
  { key: "requestDate", label: "Date", type: "date" },
  { key: "employeeName", label: "Employee" },
  { key: "itemType", label: "Type" },
  { key: "item", label: "Item" },
  { key: "quantity", label: "Qty", type: "number" },
  { key: "zone", label: "Zone", secondary: true },
  { key: "division", label: "Division", secondary: true },
  { key: "remarks", label: "Remarks", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function SampleRequestPage() {
  await connectToDatabase();

  const [docs, masters, employees] = await Promise.all([
    SampleRequestModel.find({}).sort({ requestDate: -1 }).lean(),
    loadMasterOptions(["zone", "division", "product-sample", "promotional-gift"]),
    loadEmployeeNames(),
  ]);

  const fields: Field[] = [
    { key: "requestNo", label: "Request No", section: "Request" },
    { key: "requestDate", label: "Request Date", type: "date", required: true, section: "Request" },
    { key: "employeeName", label: "Employee", type: "select", options: employees, section: "Request" },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Request" },
    { key: "division", label: "Division", type: "select", options: masters.division, section: "Request" },
    { key: "status", label: "Status", type: "select", options: STATUSES, section: "Request" },

    {
      key: "itemType",
      label: "Item Type",
      type: "select",
      options: ["sample", "gift"],
      section: "Item",
    },
    {
      key: "item",
      label: "Item",
      type: "select",
      options: [...masters["product-sample"], ...masters["promotional-gift"]],
      section: "Item",
    },
    { key: "quantity", label: "Quantity", type: "number", section: "Item" },
    { key: "remarks", label: "Remarks", type: "textarea", wide: true, section: "Item" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Sample Request"
        description="Requests for samples and promotional gifts, and the decision taken on each."
      />
      <EntityTable
        endpoint="/api/sfa/sample-requests"
        entityName="Request"
        labelKey="item"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: STATUSES },
          { key: "itemType", label: "Type", options: ["sample", "gift"] },
          { key: "employeeName", label: "Employee", options: employees },
        ]}
      />
    </div>
  );
}
