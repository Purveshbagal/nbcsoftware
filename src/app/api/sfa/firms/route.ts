import { collectionRoutes } from "@/lib/sfa-crud";
import { firmCrud } from "@/lib/sfa-entities";
import FirmModel from "@/models/Firm";

export const { GET, POST } = collectionRoutes(() => FirmModel, firmCrud);
