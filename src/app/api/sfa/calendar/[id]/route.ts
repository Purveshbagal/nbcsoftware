import { itemRoutes } from "@/lib/sfa-crud";
import { holidayCrud } from "@/lib/sfa-entities";
import HolidayModel from "@/models/Holiday";

export const { PATCH, DELETE } = itemRoutes(() => HolidayModel, holidayCrud);
