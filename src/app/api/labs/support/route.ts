import { employeeCollectionRoutes, referenceNumber } from "@/lib/labs-crud";
import SupportTicketModel from "@/models/SupportTicket";

export const { GET, POST } = employeeCollectionRoutes(() => SupportTicketModel, {
  label: "Ticket",
  ownerField: "raisedBy",
  required: ["subject"],
  sort: { createdAt: -1 },
  defaults: { status: "open" },
  fields: {
    subject: "string",
    description: "string",
    priority: "string",
  },
  prepare(doc) {
    doc.ticketNo = referenceNumber("TK");
    if (!["low", "medium", "high"].includes(String(doc.priority))) doc.priority = "medium";
  },
});
