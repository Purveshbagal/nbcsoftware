import { collectionRoutes } from "@/lib/sfa-crud";
import { administratorCrud } from "@/lib/sfa-entities";
import AdministratorModel from "@/models/Administrator";

export const { GET, POST } = collectionRoutes(() => AdministratorModel, administratorCrud);
