import { itemRoutes } from "@/lib/sfa-crud";
import { fareChartCrud } from "@/lib/sfa-entities";
import FareChartModel from "@/models/FareChart";

export const { PATCH, DELETE } = itemRoutes(() => FareChartModel, fareChartCrud);
