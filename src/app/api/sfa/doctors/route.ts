import { collectionRoutes } from "@/lib/sfa-crud";
import { doctorCrud } from "@/lib/sfa-entities";
import DoctorModel from "@/models/Doctor";

export const { GET, POST } = collectionRoutes(() => DoctorModel, doctorCrud);
