import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import ReminderModel from "@/models/Reminder";

const columns: Column[] = [
  { key: "title", label: "Reminder" },
  { key: "date", label: "Date", type: "date" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "notes", label: "Notes", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function RemindersPage() {
  await connectToDatabase();

  const [docs, employees] = await Promise.all([
    ReminderModel.find({}).sort({ date: 1 }).lean(),
    loadEmployeeNames(),
  ]);

  const fields: Field[] = [
    { key: "title", label: "Reminder", required: true, wide: true },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "assignedTo", label: "Assigned To", type: "select", options: employees },
    { key: "status", label: "Status", type: "select", options: ["open", "done"] },
    { key: "notes", label: "Notes", type: "textarea", wide: true },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Reminders"
        description="Follow-ups for the team, with who owns each one."
      />
      <EntityTable
        endpoint="/api/sfa/reminders"
        entityName="Reminder"
        labelKey="title"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: ["open", "done"] },
          { key: "assignedTo", label: "Assigned To", options: employees },
        ]}
      />
    </div>
  );
}
