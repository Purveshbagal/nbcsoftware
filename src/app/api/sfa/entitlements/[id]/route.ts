import { itemRoutes } from "@/lib/sfa-crud";
import { entitlementCrud } from "@/lib/sfa-entities";
import EntitlementModel from "@/models/Entitlement";

export const { PATCH, DELETE } = itemRoutes(() => EntitlementModel, entitlementCrud);
