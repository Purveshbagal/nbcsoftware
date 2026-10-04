import { collectionRoutes } from "@/lib/sfa-crud";
import { expenseCrud } from "@/lib/sfa-entities";
import ExpenseModel from "@/models/Expense";

export const { GET, POST } = collectionRoutes(() => ExpenseModel, expenseCrud);
