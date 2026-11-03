"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, History, IndianRupee, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  paidAmount: number;
  paidAt: string | null;
  paidBy: { username: string; name: string } | null;
};

type PendingEmployee = {
  employeeId: string;
  employeeName: string;
  zone: string;
  division: string;
  designation: string;
  expenses: Expense[];
  pendingAmount: number;
};

type PaymentRecord = {
  key: string;
  employeeName: string;
  designation: string;
  paidAt: string;
  paidBy: string;
  count: number;
  amount: number;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy, hh:mm a");
}

function inr(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ExpensePaymentClient({ expenses }: { expenses: Expense[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dueSearch, setDueSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<PendingEmployee | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment history: the expenses settled in one "Give Payment" share employee + paidAt.
  const history = useMemo(() => {
    const groups = new Map<string, PaymentRecord>();
    for (const exp of expenses) {
      if (exp.paymentStatus !== "paid" || !exp.paidAt) continue;
      const key = `${exp.employeeId}|${exp.paidAt}`;
      const record = groups.get(key) ?? {
        key,
        employeeName: exp.employeeName,
        designation: exp.designation,
        paidAt: exp.paidAt,
        paidBy: exp.paidBy?.name || exp.paidBy?.username || "-",
        count: 0,
        amount: 0,
      };
      record.count += 1;
      record.amount += exp.paidAmount;
      groups.set(key, record);
    }
    return [...groups.values()].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }, [expenses]);

  // Employees who still have unpaid expenses.
  const dueEmployees = useMemo(() => {
    const groups = new Map<string, PendingEmployee>();
    for (const exp of expenses) {
      if (exp.paymentStatus !== "pending") continue;
      const entry = groups.get(exp.employeeId) ?? {
        employeeId: exp.employeeId,
        employeeName: exp.employeeName,
        zone: exp.zone,
        division: exp.division,
        designation: exp.designation,
        expenses: [],
        pendingAmount: 0,
      };
      entry.expenses.push(exp);
      entry.pendingAmount += exp.totalAmount;
      groups.set(exp.employeeId, entry);
    }
    return [...groups.values()]
      .filter((emp) => emp.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [expenses]);

  const filteredHistory = history.filter((row) =>
    row.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDue = dueEmployees.filter((emp) =>
    emp.employeeName.toLowerCase().includes(dueSearch.toLowerCase())
  );

  const totalPending = dueEmployees.reduce((sum, emp) => sum + emp.pendingAmount, 0);
  const totalPaid = history.reduce((sum, row) => sum + row.amount, 0);

  const openDialog = () => {
    setSelectedEmployee(null);
    setDueSearch("");
    setDialogOpen(true);
  };

  const selectEmployee = (employee: PendingEmployee) => {
    setSelectedEmployee(employee);
    setPaymentAmount(employee.pendingAmount.toString());
  };

  const handleConfirmPayment = async () => {
    if (!selectedEmployee) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > selectedEmployee.pendingAmount) {
      alert("Payment amount cannot exceed total pending amount");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/sfa/expenses/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseIds: selectedEmployee.expenses.map((exp) => exp._id),
          amount,
        }),
      });

      if (res.ok) {
        alert(`Payment of ₹${amount} processed successfully`);
        // Reload to pull the new payment into the history.
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Error: Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Expense Payment</h1>
          <p className="text-muted-foreground text-sm">History of payments given to employees.</p>
        </div>
        <Button onClick={openDialog}>
          <IndianRupee className="mr-2 h-4 w-4" />
          Give Payment
          {dueEmployees.length > 0 && (
            <span className="ml-2 rounded-full bg-white/25 px-2 text-xs">{dueEmployees.length}</span>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-amber-50 p-4">
          <p className="text-amber-700 text-sm">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-700">{inr(totalPending)}</p>
          <p className="text-amber-700/80 mt-1 text-xs">{dueEmployees.length} employees waiting</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-green-700 text-sm">Paid Amount</p>
          <p className="text-2xl font-bold text-green-700">{inr(totalPaid)}</p>
          <p className="text-green-700/80 mt-1 text-xs">{history.length} payments given</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-blue-700 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-700">{inr(totalPending + totalPaid)}</p>
        </div>
      </div>

      {/* History */}
      <div className="mb-4 flex items-center gap-2">
        <History className="text-muted-foreground h-5 w-5" />
        <h2 className="text-lg font-semibold">Payment History</h2>
      </div>
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed py-10 text-center">
            {history.length === 0 ? "No payments given yet" : "No payments found"}
          </p>
        ) : (
          filteredHistory.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0">
                <h3 className="font-semibold">{row.employeeName}</h3>
                <p className="text-muted-foreground text-sm">
                  {row.designation && `${row.designation} • `}
                  {row.count} {row.count === 1 ? "expense" : "expenses"} • Paid by {row.paidBy}
                </p>
                <p className="text-muted-foreground text-xs">{formatDateTime(row.paidAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-green-600">{inr(row.amount)}</span>
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  <Check className="h-3.5 w-3.5" />
                  Paid
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Give Payment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmployee ? "Confirm Payment" : "Give Payment"}</DialogTitle>
          </DialogHeader>

          {!selectedEmployee ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Employees whose payment is still pending. Select one to pay.
              </p>
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  placeholder="Search employee..."
                  value={dueSearch}
                  onChange={(e) => setDueSearch(e.target.value)}
                />
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {filteredDue.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {dueEmployees.length === 0 ? "No pending payments" : "No employees found"}
                  </p>
                ) : (
                  filteredDue.map((emp) => (
                    <button
                      key={emp.employeeId}
                      type="button"
                      onClick={() => selectEmployee(emp)}
                      className="hover:bg-muted flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{emp.employeeName}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {emp.designation && `${emp.designation} • `}
                          {emp.expenses.length} pending{" "}
                          {emp.expenses.length === 1 ? "expense" : "expenses"}
                        </p>
                      </div>
                      <span className="font-semibold text-amber-600">{inr(emp.pendingAmount)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Employee</p>
                <p className="font-semibold">{selectedEmployee.employeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Pending Expenses</p>
                <p className="font-semibold">{selectedEmployee.expenses.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Pending Amount</p>
                <p className="text-lg font-bold text-amber-600">
                  {inr(selectedEmployee.pendingAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Payment Amount (₹)</p>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedEmployee ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmployee(null)}
                  disabled={isProcessing}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Confirm Payment"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
