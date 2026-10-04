import { collectionRoutes } from "@/lib/sfa-crud";
import { fareChartCrud } from "@/lib/sfa-entities";
import FareChartModel from "@/models/FareChart";

export const { GET, POST } = collectionRoutes(() => FareChartModel, fareChartCrud);
