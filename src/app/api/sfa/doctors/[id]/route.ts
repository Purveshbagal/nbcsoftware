import { itemRoutes } from "@/lib/sfa-crud";
import { doctorCrud } from "@/lib/sfa-entities";
import DoctorModel from "@/models/Doctor";

export const { PATCH, DELETE } = itemRoutes(() => DoctorModel, doctorCrud);
