import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import SupportTicketModel from "@/models/SupportTicket";

const columns: Column[] = [
  { key: "ticketNo", label: "Ticket" },
  { key: "subject", label: "Subject" },
  { key: "raisedBy", label: "Raised By" },
  { key: "priority", label: "Priority", type: "badge" },
  { key: "createdAt", label: "Raised On", type: "date" },
  { key: "response", label: "Response", secondary: true },
  { key: "status", label: "Status", type: "badge" },
];

export default async function SupportPage() {
  await connectToDatabase();

  const [docs, employees] = await Promise.all([
    SupportTicketModel.find({}).sort({ createdAt: -1 }).lean(),
    loadEmployeeNames(),
  ]);

  const fields: Field[] = [
    { key: "ticketNo", label: "Ticket No", section: "Ticket" },
    { key: "subject", label: "Subject", required: true, section: "Ticket" },
    { key: "raisedBy", label: "Raised By", type: "select", options: employees, section: "Ticket" },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: ["low", "medium", "high"],
      section: "Ticket",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["open", "in-progress", "resolved", "closed"],
      section: "Ticket",
    },
    { key: "description", label: "Description", type: "textarea", wide: true, section: "Ticket" },
    { key: "response", label: "Response", type: "textarea", wide: true, section: "Resolution" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Support Ticket System"
        description="Issues raised by the field team and how each was resolved."
      />
      <EntityTable
        endpoint="/api/sfa/support"
        entityName="Ticket"
        labelKey="subject"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "status", label: "Status", options: ["open", "in-progress", "resolved", "closed"] },
          { key: "priority", label: "Priority", options: ["low", "medium", "high"] },
        ]}
      />
    </div>
  );
}
