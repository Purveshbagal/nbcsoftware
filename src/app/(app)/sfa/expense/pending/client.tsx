"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Navigation } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Expense = {
  _id: string;
  employeeId: string;
  employeeName: string;
  zone: string;
  division: string;
  designation: string;
  expenseDate: string;
  workPlan: string;
  fromTaluka: string;
  toTaluka: string;
  distanceKm: number;
  travelMode: string;
  travelAllowance: number;
  workPlanAllowance: number;
  requestedExpenses: number;
  totalAmount: number;
  paymentStatus: string;
};

export default function PendingExpenseClient({ expenses }: { expenses: Expense[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWorkPlan, setFilterWorkPlan] = useState<string>("all");

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWorkPlan = filterWorkPlan === "all" || exp.workPlan === filterWorkPlan;
    return matchesSearch && matchesWorkPlan;
  });

  // Group by employee
  const groupedByEmployee = filteredExpenses.reduce((acc, exp) => {
    if (!acc[exp.employeeId]) {
      acc[exp.employeeId] = {
        employeeName: exp.employeeName,
        zone: exp.zone,
        division: exp.division,
        designation: exp.designation,
        expenses: [],
        totalAmount: 0,
      };
    }
    acc[exp.employeeId].expenses.push(exp);
    acc[exp.employeeId].totalAmount += exp.totalAmount;
    return acc;
  }, {} as Record<string, { employeeName: string; zone: string; division: string; designation: string; expenses: Expense[]; totalAmount: number }>);

  const getWorkPlanLabel = (workPlan: string) => {
    const labels: Record<string, string> = {
      headquarter: "Headquarter",
      "in-city": "In City",
      outstation: "Outstation",
    };
    return labels[workPlan] || workPlan;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      bike: "Bike",
      car: "Car",
      "public-transport": "Public Transport",
    };
    return labels[mode] || mode;
  };

  const totalPending = Object.values(groupedByEmployee).reduce(
    (sum, emp) => sum + emp.totalAmount,
    0
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Pending Expenses</h1>

      {/* Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-amber-50 p-4">
          <p className="text-amber-700 text-sm">Total Employees</p>
          <p className="text-2xl font-bold text-amber-700">
            {Object.keys(groupedByEmployee).length}
          </p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-blue-700 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-700">{filteredExpenses.length}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-green-700 text-sm">Total Pending Amount</p>
          <p className="text-2xl font-bold text-green-700">₹{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div>
          <Input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={filterWorkPlan} onValueChange={(val) => setFilterWorkPlan(val ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Work Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Plans</SelectItem>
              <SelectItem value="headquarter">Headquarter</SelectItem>
              <SelectItem value="in-city">In City</SelectItem>
              <SelectItem value="outstation">Outstation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grouped Expenses */}
      <div className="space-y-4">
        {Object.keys(groupedByEmployee).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No pending expenses found</p>
        ) : (
          Object.entries(groupedByEmployee).map(([employeeId, data]) => (
            <div key={employeeId} className="rounded-lg border p-4">
              {/* Employee Header */}
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-semibold">{data.employeeName}</h3>
                  <p className="text-muted-foreground text-sm">
                    {data.designation && `${data.designation} • `}
                    {data.zone && `${data.zone} • `}
                    {data.division}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Total Pending</p>
                  <p className="text-2xl font-bold text-green-600">₹{data.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Employee's Expenses */}
              <div className="space-y-2">
                {data.expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="rounded-md bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">
                            {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {getWorkPlanLabel(expense.workPlan)}
                          </span>
                        </div>

                        {expense.workPlan === "outstation" && (
                          <div className="mb-1 flex items-center gap-2 text-sm">
                            <Navigation className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {expense.fromTaluka} → {expense.toTaluka}
                            </span>
                            <span className="text-muted-foreground">({expense.distanceKm} km)</span>
                            {expense.travelMode && (
                              <span className="text-muted-foreground">
                                • {getModeLabel(expense.travelMode)}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Travel: ₹{expense.travelAllowance} + Work Plan: ₹
                            {expense.workPlanAllowance}
                            {expense.requestedExpenses > 0 &&
                              ` + Requests: ₹${expense.requestedExpenses}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">₹{expense.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
