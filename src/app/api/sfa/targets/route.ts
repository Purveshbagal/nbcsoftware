import { collectionRoutes } from "@/lib/sfa-crud";
import { targetCrud } from "@/lib/sfa-entities";
import TargetModel from "@/models/Target";

export const { GET, POST } = collectionRoutes(() => TargetModel, targetCrud);
