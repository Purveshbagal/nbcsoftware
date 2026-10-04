import { itemRoutes } from "@/lib/sfa-crud";
import { targetCrud } from "@/lib/sfa-entities";
import TargetModel from "@/models/Target";

export const { PATCH, DELETE } = itemRoutes(() => TargetModel, targetCrud);
