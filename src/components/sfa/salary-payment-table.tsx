"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, IndianRupee, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type PaymentRow = {
  _id: string;
  employeeCode: string;
  employeeName: string;
  month: string;
  salaryAmount: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  absentDeduction: number;
  advanceDeduction: number;
  netPayable: number;
  paidAmount: number;
  paymentDate: string;
  paymentMode: string;
  remarks: string;
  paidBy: string;
};

type Employee = {
  _id: string;
  code: string;
  name: string;
  designation: string;
};

type PendingSalary = {
  monthlySalary: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  totalWorkingDays: number;
  perDayRate: number;
  absentDeduction: number;
  advanceDeduction: number;
  netPayable: number;
};

export function SalaryPaymentTable({ rows, employees }: { rows: PaymentRow[]; employees: Employee[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [givePaymentOpen, setGivePaymentOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Give payment form state
  const [selectedEmployee, setSelectedEmployee] = React.useState("");
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = React.useState("cash");
  const [remarks, setRemarks] = React.useState("");
  const [pendingSalary, setPendingSalary] = React.useState<PendingSalary | null>(null);
  const [loadingPending, setLoadingPending] = React.useState(false);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.employeeName.toLowerCase().includes(needle) ||
        row.employeeCode.toLowerCase().includes(needle) ||
        row.month.includes(needle)
    );
  }, [rows, query]);

  const monthOptions = React.useMemo(() => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let i = 0; i < 12; i++) {
      const value = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      const label = monthNames[i];
      options.push({ value, label });
    }
    return options;
  }, []);

  function openGivePayment() {
    setSelectedEmployee("");
    setSelectedMonth("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode("cash");
    setRemarks("");
    setPendingSalary(null);
    setGivePaymentOpen(true);
  }

  async function fetchPendingSalary() {
    if (!selectedEmployee || !selectedMonth) return;

    setLoadingPending(true);
    try {
      const res = await fetch(`/api/sfa/hr/pending-salary?month=${selectedMonth}`);
      const data = await res.json();
      if (res.ok) {
        const empPending = data.items.find((item: any) => item._id === selectedEmployee);
        setPendingSalary(empPending || null);
      } else {
        toast.error("Failed to fetch pending salary");
      }
    } catch {
      toast.error("Failed to fetch pending salary");
    } finally {
      setLoadingPending(false);
    }
  }

  React.useEffect(() => {
    if (selectedEmployee && selectedMonth) {
      fetchPendingSalary();
    }
  }, [selectedEmployee, selectedMonth]);

  async function handleGivePayment() {
    if (!selectedEmployee || !selectedMonth || !paymentDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sfa/hr/salary-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          month: selectedMonth,
          paymentDate,
          paymentMode,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to record payment");
        return;
      }

      toast.success("Salary payment recorded successfully");
      setGivePaymentOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payments"
            className="pl-9"
          />
        </div>
        <Button onClick={openGivePayment}>
          <Plus />
          Give Payment
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead className="text-right">Net Paid</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{row.employeeName}</div>
                    <div className="text-sm text-muted-foreground">{row.employeeCode}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(row.month + "-01").toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">₹{row.salaryAmount.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right font-semibold text-green-700">
                  ₹{row.paidAmount.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>{new Date(row.paymentDate).toLocaleDateString("en-IN")}</TableCell>
                <TableCell className="capitalize">{row.paymentMode}</TableCell>
                <TableCell>{row.paidBy}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPayment(row);
                      setDetailsOpen(true);
                    }}
                  >
                    <Eye />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Give Payment Dialog */}
      <Dialog open={givePaymentOpen} onOpenChange={setGivePaymentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Give Salary Payment</DialogTitle>
            <DialogDescription>Select employee and month to record payment</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Employee *</Label>
              <Select value={selectedEmployee} onValueChange={(value) => value && setSelectedEmployee(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.name} ({emp.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Month *</Label>
              <Select value={selectedMonth} onValueChange={(value) => value && setSelectedMonth(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingPending && (
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                Loading pending salary...
              </div>
            )}

            {pendingSalary && (
              <div className="rounded-lg border p-4 space-y-3 bg-blue-50">
                <h4 className="font-semibold">Payment Breakdown</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Base Salary:</div>
                  <div className="text-right font-semibold">₹{pendingSalary.monthlySalary.toLocaleString("en-IN")}</div>

                  <div>Present Days:</div>
                  <div className="text-right text-green-600">{pendingSalary.presentDays} days</div>

                  <div>Absent Days:</div>
                  <div className="text-right text-red-600">{pendingSalary.absentDays} days</div>

                  <div>Paid Leave:</div>
                  <div className="text-right text-blue-600">{pendingSalary.paidLeaveDays} days</div>

                  <div>Absent Deduction:</div>
                  <div className="text-right text-red-600">-₹{pendingSalary.absentDeduction.toLocaleString("en-IN")}</div>

                  {pendingSalary.advanceDeduction > 0 && (
                    <>
                      <div>Advance Deduction:</div>
                      <div className="text-right text-orange-600">
                        -₹{pendingSalary.advanceDeduction.toLocaleString("en-IN")}
                      </div>
                    </>
                  )}

                  <div className="font-semibold text-base pt-2 border-t">Net Payable:</div>
                  <div className="text-right font-bold text-lg text-green-700 pt-2 border-t">
                    ₹{pendingSalary.netPayable.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(value) => value && setPaymentMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGivePaymentOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleGivePayment} disabled={saving || !pendingSalary}>
              {saving ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              {selectedPayment?.employeeName} - {selectedPayment?.month}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee Code</p>
                  <p className="font-medium">{selectedPayment.employeeCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Date</p>
                  <p className="font-medium">{new Date(selectedPayment.paymentDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Base Salary</p>
                  <p className="font-medium">₹{selectedPayment.salaryAmount.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Present Days</p>
                  <p className="font-medium text-green-600">{selectedPayment.presentDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Absent Days</p>
                  <p className="font-medium text-red-600">{selectedPayment.absentDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid Leave Days</p>
                  <p className="font-medium text-blue-600">{selectedPayment.paidLeaveDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Absent Deduction</p>
                  <p className="font-medium text-red-600">-₹{selectedPayment.absentDeduction.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Advance Deduction</p>
                  <p className="font-medium text-orange-600">
                    {selectedPayment.advanceDeduction > 0
                      ? `-₹${selectedPayment.advanceDeduction.toLocaleString("en-IN")}`
                      : "₹0"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Mode</p>
                  <p className="font-medium capitalize">{selectedPayment.paymentMode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid By</p>
                  <p className="font-medium">{selectedPayment.paidBy}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Amount Paid:</span>
                  <span className="text-2xl font-bold text-green-700">
                    ₹{selectedPayment.paidAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {selectedPayment.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm border rounded p-2 bg-muted/30">{selectedPayment.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
