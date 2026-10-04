import { collectionRoutes } from "@/lib/sfa-crud";
import { monthMaintenanceCrud } from "@/lib/sfa-entities";
import MonthMaintenanceModel from "@/models/MonthMaintenance";

export const { GET, POST } = collectionRoutes(() => MonthMaintenanceModel, monthMaintenanceCrud);
