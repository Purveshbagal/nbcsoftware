import { itemRoutes } from "@/lib/sfa-crud";
import { firmVisitCrud } from "@/lib/sfa-entities";
import VisitModel from "@/models/Visit";

export const { PATCH, DELETE } = itemRoutes(() => VisitModel, firmVisitCrud);
