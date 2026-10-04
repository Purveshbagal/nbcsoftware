import { itemRoutes } from "@/lib/sfa-crud";
import { employeeCrud } from "@/lib/sfa-entities";
import EmployeeModel from "@/models/Employee";

export const { PATCH, DELETE } = itemRoutes(() => EmployeeModel, employeeCrud);
