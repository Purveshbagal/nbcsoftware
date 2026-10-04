import { employeeCollectionRoutes } from "@/lib/labs-crud";
import ExpenseModel from "@/models/Expense";

export const { GET, POST } = employeeCollectionRoutes(() => ExpenseModel, {
  label: "Expense",
  required: ["expenseDate", "head"],
  sort: { expenseDate: -1 },
  defaults: { status: "pending" },
  filters: { status: "status" },
  fields: {
    expenseDate: "string",
    head: "string",
    modeOfTravel: "string",
    fromCity: "string",
    toCity: "string",
    distanceKm: "number",
    fare: "number",
    otherAmount: "number",
    remarks: "string",
  },
});
