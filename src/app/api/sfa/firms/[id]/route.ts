import { itemRoutes } from "@/lib/sfa-crud";
import { firmCrud } from "@/lib/sfa-entities";
import FirmModel from "@/models/Firm";

export const { PATCH, DELETE } = itemRoutes(() => FirmModel, firmCrud);
