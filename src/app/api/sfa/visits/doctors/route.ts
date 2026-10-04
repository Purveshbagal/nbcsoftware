import { collectionRoutes } from "@/lib/sfa-crud";
import { doctorVisitCrud } from "@/lib/sfa-entities";
import VisitModel from "@/models/Visit";

export const { GET, POST } = collectionRoutes(() => VisitModel, doctorVisitCrud);
