import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import {
  loadDoctorNames,
  loadEmployeeNames,
  loadMasterOptions,
} from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import VisitModel from "@/models/Visit";

const columns: Column[] = [
  { key: "visitCode", label: "Visit ID" },
  { key: "doctor", label: "Doctor Name" },
  { key: "clinicAddress", label: "Clinic Address", secondary: true },
  { key: "city", label: "City" },
  { key: "zone", label: "Zone" },
  { key: "employeeName", label: "Employee Name" },
  { key: "visitDate", label: "Visit Date", type: "date" },
  { key: "callObjective", label: "Call Objective", secondary: true },
  { key: "products", label: "Products", type: "list", secondary: true },
  { key: "pobValue", label: "POB Value", type: "currency", secondary: true },
  { key: "createdAt", label: "Created Date", type: "date", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function DoctorVisitsPage() {
  await connectToDatabase();

  const [docs, masters, employees, doctors] = await Promise.all([
    VisitModel.find({ visitType: "doctor" }).sort({ visitDate: -1 }).lean(),
    loadMasterOptions([
      "zone",
      "division",
      "call-objective",
      "post-call-info",
      "skipped-reason",
      "product-sample",
      "promotional-gift",
    ]),
    loadEmployeeNames(),
    loadDoctorNames(),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "visitCode", label: "Visit ID", section: "Visit" },
    { key: "doctor", label: "Doctor", type: "select", options: doctors, required: true, section: "Visit" },
    { key: "employeeName", label: "Employee", type: "select", options: employees, section: "Visit" },
    { key: "visitDate", label: "Visit Date", type: "date", required: true, section: "Visit" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["planned", "open", "closed", "skipped"],
      section: "Visit",
    },
    { key: "clinicAddress", label: "Clinic Address", type: "textarea", wide: true, section: "Visit" },
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
    {
      key: "postCallInfo",
      label: "Post Call Information",
      type: "select",
      options: masters["post-call-info"],
      section: "Call details",
    },
    {
      key: "samples",
      label: "Samples Given",
      type: "multiselect",
      options: masters["product-sample"],
      section: "Call details",
    },
    {
      key: "gifts",
      label: "Gifts Given",
      type: "multiselect",
      options: masters["promotional-gift"],
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
        title="Doctors Visit"
        description="Every doctor call: planned, closed, open or skipped, with what was detailed and the business booked."
      />
      <EntityTable
        endpoint="/api/sfa/visits/doctors"
        entityName="Visit"
        labelKey="doctor"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: ["planned", "open", "closed", "skipped"] },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "division", label: "Division", options: masters.division },
          { key: "employeeName", label: "Employee", options: employees },
        ]}
      />
    </div>
  );
}
