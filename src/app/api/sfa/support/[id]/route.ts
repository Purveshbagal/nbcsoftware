import { itemRoutes } from "@/lib/sfa-crud";
import { supportTicketCrud } from "@/lib/sfa-entities";
import SupportTicketModel from "@/models/SupportTicket";

export const { PATCH, DELETE } = itemRoutes(() => SupportTicketModel, supportTicketCrud);
