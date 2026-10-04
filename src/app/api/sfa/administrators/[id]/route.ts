import { itemRoutes } from "@/lib/sfa-crud";
import { administratorCrud } from "@/lib/sfa-entities";
import AdministratorModel from "@/models/Administrator";

export const { PATCH, DELETE } = itemRoutes(() => AdministratorModel, administratorCrud);
