import { itemRoutes } from "@/lib/sfa-crud";
import { expenseCrud } from "@/lib/sfa-entities";
import ExpenseModel from "@/models/Expense";

export const { PATCH, DELETE } = itemRoutes(() => ExpenseModel, expenseCrud);
