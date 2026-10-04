import { collectionRoutes } from "@/lib/sfa-crud";
import { supportTicketCrud } from "@/lib/sfa-entities";
import SupportTicketModel from "@/models/SupportTicket";

export const { GET, POST } = collectionRoutes(() => SupportTicketModel, supportTicketCrud);
