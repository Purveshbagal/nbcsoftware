import { collectionRoutes } from "@/lib/sfa-crud";
import { leaveCrud } from "@/lib/sfa-entities";
import LeaveModel from "@/models/Leave";

export const { GET, POST } = collectionRoutes(() => LeaveModel, leaveCrud);
