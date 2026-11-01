"use client";

import * as React from "react";
import { ChevronDown, Eye, IndianRupee, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PendingSalaryRow = {
  _id: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
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

type EmployeeDetails = {
  attendance: Array<{
    date: string;
    status: string;
    punchIn?: string;
    punchOut?: string;
    workingMinutes: number;
  }>;
  leaves: Array<{
    _id: string;
    fromDate: string;
    toDate: string;
    days: number;
    reason: string;
    leaveType: string;
  }>;
  advance: {
    type: string;
    amount: number;
    installmentNumber?: number;
    totalInstallments?: number;
    totalAdvance?: number;
    remainingAmount?: number;
    status?: string;
  } | null;
};

export function PendingSalaryTable({ defaultMonth }: { defaultMonth: string }) {
  const [month, setMonth] = React.useState(defaultMonth);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<PendingSalaryRow[]>([]);
  const [daysInMonth, setDaysInMonth] = React.useState(30);
  const [selectedEmployee, setSelectedEmployee] = React.useState<PendingSalaryRow | null>(null);
  const [employeeDetails, setEmployeeDetails] = React.useState<EmployeeDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

  // Generate month options (January to December of current year)
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

  // Fetch pending salary data
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sfa/hr/pending-salary?month=${month}`);
        const data = await res.json();
        if (res.ok) {
          setRows(data.items || []);
          setDaysInMonth(data.daysInMonth || 30);
        } else {
          toast.error(data.error || "Failed to load pending salaries");
        }
      } catch {
        toast.error("Failed to load pending salaries");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [month]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.employeeName.toLowerCase().includes(needle) ||
        row.employeeCode.toLowerCase().includes(needle) ||
        row.designation.toLowerCase().includes(needle)
    );
  }, [rows, query]);

  async function viewDetails(employee: PendingSalaryRow) {
    setSelectedEmployee(employee);
    setLoadingDetails(true);
    setEmployeeDetails(null);

    try {
      const res = await fetch(`/api/sfa/hr/pending-salary/${employee._id}?month=${month}`);
      const data = await res.json();
      if (res.ok) {
        setEmployeeDetails(data);
      } else {
        toast.error("Failed to load employee details");
      }
    } catch {
      toast.error("Failed to load employee details");
    } finally {
      setLoadingDetails(false);
    }
  }

  const totalNetPayable = filtered.reduce((sum, row) => sum + row.netPayable, 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="month-select" className="text-sm font-medium whitespace-nowrap">
            Select Month:
          </Label>
          <Select value={month} onValueChange={(value) => value && setMonth(value)}>
            <SelectTrigger id="month-select" className="w-[200px]">
              <SelectValue />
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

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees"
            className="pl-9"
          />
        </div>

        <span className="text-muted-foreground text-sm">
          {filtered.length} of {rows.length} employees
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="text-right">Monthly Salary</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Paid Leave</TableHead>
                  <TableHead className="text-right">Absent Deduction</TableHead>
                  <TableHead className="text-right">Advance Deduction</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="font-medium">{row.employeeCode}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.designation || "-"}</TableCell>
                    <TableCell className="text-right">
                      ₹{row.monthlySalary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">
                      {row.presentDays}
                    </TableCell>
                    <TableCell className="text-center text-red-600 font-semibold">
                      {row.absentDays}
                    </TableCell>
                    <TableCell className="text-center text-blue-600 font-semibold">
                      {row.paidLeaveDays}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -₹{row.absentDeduction.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {row.advanceDeduction > 0
                        ? `-₹${row.advanceDeduction.toLocaleString("en-IN")}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      ₹{row.netPayable.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => viewDetails(row)}>
                        <Eye />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium">
              Total Working Days: {daysInMonth}
            </span>
            <span className="text-lg font-bold text-green-700">
              Total Net Payable: ₹{totalNetPayable.toLocaleString("en-IN")}
            </span>
          </div>
        </>
      )}

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Details - {selectedEmployee?.employeeName}</DialogTitle>
            <DialogDescription>
              Detailed breakdown for {month}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : employeeDetails ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="text-2xl font-bold">₹{selectedEmployee?.monthlySalary.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Payable</p>
                  <p className="text-2xl font-bold text-green-700">
                    ₹{selectedEmployee?.netPayable.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Attendance Details */}
              <div>
                <h3 className="font-semibold mb-3">Attendance Details</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Punch In</TableHead>
                        <TableHead>Punch Out</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeDetails.attendance.map((att) => (
                        <TableRow key={att.date}>
                          <TableCell>
                            {new Date(att.date).toLocaleDateString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                att.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {att.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {att.punchIn
                              ? new Date(att.punchIn).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {att.punchOut
                              ? new Date(att.punchOut).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {att.workingMinutes ? (att.workingMinutes / 60).toFixed(2) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Leave Details */}
              {employeeDetails.leaves.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Approved Leaves</h3>
                  <div className="space-y-2">
                    {employeeDetails.leaves.map((leave) => (
                      <div key={leave._id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{leave.leaveType}</span>
                          <span className="text-sm text-muted-foreground">
                            {leave.days} {leave.days === 1 ? "day" : "days"}
                          </span>
                        </div>
                        <p className="text-sm">
                          {new Date(leave.fromDate).toLocaleDateString("en-IN")} -{" "}
                          {new Date(leave.toDate).toLocaleDateString("en-IN")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advance Details */}
              {employeeDetails.advance && (
                <div>
                  <h3 className="font-semibold mb-3">Advance Deduction</h3>
                  <div className="rounded-lg border bg-orange-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {employeeDetails.advance.type === "one_time"
                          ? "One-time Deduction"
                          : `Installment ${employeeDetails.advance.installmentNumber}/${employeeDetails.advance.totalInstallments}`}
                      </span>
                      <span className="text-lg font-bold text-orange-700">
                        ₹{employeeDetails.advance.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {employeeDetails.advance.type === "installment" && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Total Advance: ₹{employeeDetails.advance.totalAdvance?.toLocaleString("en-IN")}</p>
                        <p>Remaining: ₹{employeeDetails.advance.remainingAmount?.toLocaleString("en-IN")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
