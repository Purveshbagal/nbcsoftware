import { itemRoutes } from "@/lib/sfa-crud";
import { sfaProductCrud } from "@/lib/sfa-entities";
import SfaProductModel from "@/models/SfaProduct";

export const { PATCH, DELETE } = itemRoutes(() => SfaProductModel, sfaProductCrud);
