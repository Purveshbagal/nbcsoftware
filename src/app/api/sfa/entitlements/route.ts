import { collectionRoutes } from "@/lib/sfa-crud";
import { entitlementCrud } from "@/lib/sfa-entities";
import EntitlementModel from "@/models/Entitlement";

export const { GET, POST } = collectionRoutes(() => EntitlementModel, entitlementCrud);
