import { Metadata } from "next";

import ExpenseSettingsClient from "./client";

export const metadata: Metadata = {
  title: "Expense Settings",
};

export default function ExpenseSettingsPage() {
  return <ExpenseSettingsClient />;
}
