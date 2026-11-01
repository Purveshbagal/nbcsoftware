"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DollarSign, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  paidAmount: number;
  paidAt: string | null;
  paidBy: { username: string; name: string } | null;
};

export default function ExpensePaymentClient({
  expenses: initialExpenses,
}: {
  expenses: Expense[];
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    employeeId: string;
    employeeName: string;
    expenses: Expense[];
    totalAmount: number;
    pendingAmount: number;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && exp.paymentStatus === "pending") ||
      (filterStatus === "paid" && exp.paymentStatus === "paid");
    return matchesSearch && matchesStatus;
  });

  // Group by employee
  const groupedByEmployee = filteredExpenses.reduce((acc, exp) => {
    if (!acc[exp.employeeId]) {
      acc[exp.employeeId] = {
        employeeId: exp.employeeId,
        employeeName: exp.employeeName,
        zone: exp.zone,
        division: exp.division,
        designation: exp.designation,
        expenses: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }
    acc[exp.employeeId].expenses.push(exp);
    acc[exp.employeeId].totalAmount += exp.totalAmount;
    if (exp.paymentStatus === "paid") {
      acc[exp.employeeId].paidAmount += exp.paidAmount;
    } else {
      acc[exp.employeeId].pendingAmount += exp.totalAmount;
    }
    return acc;
  }, {} as Record<string, { employeeId: string; employeeName: string; zone: string; division: string; designation: string; expenses: Expense[]; totalAmount: number; paidAmount: number; pendingAmount: number }>);

  const handleGivePayment = (employeeData: any) => {
    setSelectedEmployee(employeeData);
    setPaymentAmount(employeeData.pendingAmount.toString());
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedEmployee) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > selectedEmployee.totalAmount) {
      alert("Payment amount cannot exceed total pending amount");
      return;
    }

    setIsProcessing(true);
    try {
      // Get all pending expense IDs for this employee
      const pendingExpenseIds = selectedEmployee.expenses
        .filter((exp) => exp.paymentStatus === "pending")
        .map((exp) => exp._id);

      const res = await fetch("/api/sfa/expenses/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseIds: pendingExpenseIds,
          amount: amount,
        }),
      });

      if (res.ok) {
        alert(`Payment of ₹${amount} processed successfully`);
        // Reload page to get updated data
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error: Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = {
    totalEmployees: Object.keys(groupedByEmployee).length,
    totalPending: Object.values(groupedByEmployee).reduce(
      (sum, emp) => sum + emp.pendingAmount,
      0
    ),
    totalPaid: Object.values(groupedByEmployee).reduce((sum, emp) => sum + emp.paidAmount, 0),
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Expense Payment</h1>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Employees</p>
          <p className="text-2xl font-bold">{stats.totalEmployees}</p>
        </div>
        <div className="rounded-lg border bg-amber-50 p-4">
          <p className="text-amber-700 text-sm">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-700">₹{stats.totalPending.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-green-700 text-sm">Paid Amount</p>
          <p className="text-2xl font-bold text-green-700">₹{stats.totalPaid.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-blue-700 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-700">
            ₹{(stats.totalPending + stats.totalPaid).toFixed(2)}
          </p>
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
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? "pending")}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee List */}
      <div className="space-y-3">
        {Object.keys(groupedByEmployee).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No expenses found</p>
        ) : (
          Object.entries(groupedByEmployee).map(([employeeId, data]) => (
            <div key={employeeId} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{data.employeeName}</h3>
                  <p className="text-muted-foreground text-sm">
                    {data.designation && `${data.designation} • `}
                    {data.zone && `${data.zone} • `}
                    {data.division}
                  </p>
                  <div className="mt-2 flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Expenses: </span>
                      <span className="font-medium">{data.expenses.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount: </span>
                      <span className="font-medium">₹{data.totalAmount.toFixed(2)}</span>
                    </div>
                    {data.paidAmount > 0 && (
                      <div>
                        <span className="text-muted-foreground">Paid: </span>
                        <span className="font-medium text-green-600">
                          ₹{data.paidAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {data.pendingAmount > 0 && (
                      <div>
                        <span className="text-muted-foreground">Pending: </span>
                        <span className="font-medium text-amber-600">
                          ₹{data.pendingAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {data.pendingAmount > 0 && (
                  <Button onClick={() => handleGivePayment(data)} className="ml-4">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Give Payment
                  </Button>
                )}
                {data.pendingAmount === 0 && data.paidAmount > 0 && (
                  <div className="ml-4 flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                    <Check className="h-4 w-4" />
                    Paid
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Payment</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Employee</p>
                <p className="font-semibold">{selectedEmployee.employeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Pending Expenses</p>
                <p className="font-semibold">{selectedEmployee.expenses.filter(e => e.paymentStatus === "pending").length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Pending Amount</p>
                <p className="text-lg font-bold text-amber-600">
                  ₹{selectedEmployee.pendingAmount.toFixed(2)}
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
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
