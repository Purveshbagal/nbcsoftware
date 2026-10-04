import { collectionRoutes } from "@/lib/sfa-crud";
import { employeeCrud } from "@/lib/sfa-entities";
import EmployeeModel from "@/models/Employee";

export const { GET, POST } = collectionRoutes(() => EmployeeModel, employeeCrud);
