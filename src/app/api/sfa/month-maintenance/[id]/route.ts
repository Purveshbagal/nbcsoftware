import { itemRoutes } from "@/lib/sfa-crud";
import { monthMaintenanceCrud } from "@/lib/sfa-entities";
import MonthMaintenanceModel from "@/models/MonthMaintenance";

export const { PATCH, DELETE } = itemRoutes(() => MonthMaintenanceModel, monthMaintenanceCrud);
