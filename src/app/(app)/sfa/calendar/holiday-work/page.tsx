import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import HolidayModel from "@/models/Holiday";

const columns: Column[] = [
  { key: "calendarType", label: "Calendar", type: "badge" },
  { key: "date", label: "Date", type: "date" },
  { key: "occasion", label: "Occasion" },
  { key: "zone", label: "Zone" },
  { key: "employeeName", label: "Employee" },
];

export default async function HolidayWorkCalendarPage() {
  await connectToDatabase();

  const [docs, masters, employees] = await Promise.all([
    HolidayModel.find({}).sort({ date: 1 }).lean(),
    loadMasterOptions(["zone"]),
    loadEmployeeNames(),
  ]);

  const fields: Field[] = [
    {
      key: "calendarType",
      label: "Calendar",
      type: "select",
      options: ["holiday", "work", "restricted"],
      required: true,
    },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "occasion", label: "Occasion", wide: true },
    { key: "zone", label: "Zone", type: "select", options: masters.zone },
    {
      key: "employeeName",
      label: "Employee",
      type: "select",
      options: employees,
      placeholder: "Only for the work calendar",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Holiday & Work Calendar"
        description="Zone holidays, restricted holidays and per-employee working days in one list. Filter by calendar to see one at a time."
      />
      <EntityTable
        endpoint="/api/sfa/calendar"
        entityName="Calendar entry"
        labelKey="occasion"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "calendarType", label: "Calendar", options: ["holiday", "work", "restricted"] },
          { key: "zone", label: "Zone", options: masters.zone },
        ]}
      />
    </div>
  );
}
