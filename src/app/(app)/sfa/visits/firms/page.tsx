import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadFirmNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import VisitModel from "@/models/Visit";

const columns: Column[] = [
  { key: "visitCode", label: "Visit ID" },
  { key: "firm", label: "Firm Name" },
  { key: "clinicAddress", label: "Visit Address", secondary: true },
  { key: "city", label: "City" },
  { key: "zone", label: "Zone" },
  { key: "employeeName", label: "Employee Name" },
  { key: "visitDate", label: "Visit Date", type: "date" },
  { key: "pobValue", label: "POB Value", type: "currency", secondary: true },
  { key: "createdAt", label: "Created Date", type: "date", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function FirmVisitsPage() {
  await connectToDatabase();

  const [docs, masters, employees, firms] = await Promise.all([
    VisitModel.find({ visitType: "firm" }).sort({ visitDate: -1 }).lean(),
    loadMasterOptions(["zone", "division", "call-objective", "skipped-reason"]),
    loadEmployeeNames(),
    loadFirmNames(),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "visitCode", label: "Visit ID", section: "Visit" },
    { key: "firm", label: "Firm", type: "select", options: firms, required: true, section: "Visit" },
    { key: "employeeName", label: "Employee", type: "select", options: employees, section: "Visit" },
    { key: "visitDate", label: "Visit Date", type: "date", required: true, section: "Visit" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["planned", "open", "closed", "skipped"],
      section: "Visit",
    },
    { key: "clinicAddress", label: "Visit Address", type: "textarea", wide: true, section: "Visit" },
    { key: "city", label: "City", section: "Visit" },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Visit" },
    { key: "division", label: "Division", type: "select", options: masters.division, section: "Visit" },

    {
      key: "callObjective",
      label: "Call Objective",
      type: "select",
      options: masters["call-objective"],
      section: "Call details",
    },
    { key: "pobValue", label: "POB Value (₹)", type: "number", section: "Call details" },
    {
      key: "skippedReason",
      label: "Skipped Reason",
      type: "select",
      options: masters["skipped-reason"],
      section: "Call details",
    },
    { key: "remarks", label: "Remarks", type: "textarea", wide: true, section: "Call details" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Firms Visit"
        description="Calls made on distributors, stockists and retailers."
      />
      <EntityTable
        endpoint="/api/sfa/visits/firms"
        entityName="Visit"
        labelKey="firm"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: ["planned", "open", "closed", "skipped"] },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "employeeName", label: "Employee", options: employees },
        ]}
      />
    </div>
  );
}
