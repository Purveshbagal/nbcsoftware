import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { distinctValues, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import SfaProductModel from "@/models/SfaProduct";

const columns: Column[] = [
  { key: "code", label: "Code" },
  { key: "name", label: "Product Name" },
  { key: "composition", label: "Composition", secondary: true },
  { key: "pack", label: "Pack" },
  { key: "division", label: "Division" },
  { key: "productGroup", label: "Group", secondary: true },
  { key: "uom", label: "UOM", secondary: true },
  { key: "mrp", label: "MRP", type: "currency" },
  { key: "ptr", label: "PTR", type: "currency", secondary: true },
  { key: "pts", label: "PTS", type: "currency", secondary: true },
  { key: "indication", label: "Indication", secondary: true },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function ProductsPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    SfaProductModel.find({}).sort({ name: 1 }).lean(),
    loadMasterOptions(["division", "product-indication", "uom"]),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "code", label: "Product Code", section: "Product" },
    { key: "name", label: "Product Name", required: true, section: "Product" },
    { key: "composition", label: "Composition", type: "textarea", wide: true, section: "Product" },
    { key: "pack", label: "Pack", section: "Product" },
    { key: "division", label: "Division", type: "select", options: masters.division, section: "Product" },
    { key: "productGroup", label: "Product Group", section: "Product" },
    {
      key: "indication",
      label: "Indication",
      type: "select",
      options: masters["product-indication"],
      section: "Product",
    },
    { key: "uom", label: "UOM", type: "select", options: masters.uom, section: "Product" },

    { key: "mrp", label: "MRP (₹)", type: "number", section: "Pricing" },
    { key: "ptr", label: "PTR (₹)", type: "number", section: "Pricing" },
    { key: "pts", label: "PTS (₹)", type: "number", section: "Pricing" },
    { key: "qrCode", label: "QR / Barcode", section: "Pricing" },
    { key: "isActive", label: "Active", type: "checkbox", section: "Pricing" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Products"
        description="The catalogue detailed on calls and ordered by firms, with trade pricing."
      />
      <EntityTable
        endpoint="/api/sfa/products"
        entityName="Product"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "division", label: "Division", options: masters.division },
          { key: "productGroup", label: "Group", options: distinctValues(rows, "productGroup") },
        ]}
      />
    </div>
  );
}
