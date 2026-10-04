import { collectionRoutes } from "@/lib/sfa-crud";
import { sfaProductCrud } from "@/lib/sfa-entities";
import SfaProductModel from "@/models/SfaProduct";

export const { GET, POST } = collectionRoutes(() => SfaProductModel, sfaProductCrud);
