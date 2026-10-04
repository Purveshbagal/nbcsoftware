import { collectionRoutes } from "@/lib/sfa-crud";
import { firmVisitCrud } from "@/lib/sfa-entities";
import VisitModel from "@/models/Visit";

export const { GET, POST } = collectionRoutes(() => VisitModel, firmVisitCrud);
