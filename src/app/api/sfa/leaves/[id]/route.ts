import { itemRoutes } from "@/lib/sfa-crud";
import { leaveCrud } from "@/lib/sfa-entities";
import LeaveModel from "@/models/Leave";

export const { PATCH, DELETE } = itemRoutes(() => LeaveModel, leaveCrud);
