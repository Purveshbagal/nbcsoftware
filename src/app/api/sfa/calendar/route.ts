import { collectionRoutes } from "@/lib/sfa-crud";
import { holidayCrud } from "@/lib/sfa-entities";
import HolidayModel from "@/models/Holiday";

export const { GET, POST } = collectionRoutes(() => HolidayModel, holidayCrud);
