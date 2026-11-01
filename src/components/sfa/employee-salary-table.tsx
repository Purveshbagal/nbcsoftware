"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit2, IndianRupee, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EmployeeSalaryRow = {
  _id: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  contactNo: string;
  salaryAmount: number;
  effectiveFrom: string;
  updatedBy: string;
};

export function EmployeeSalaryTable({ rows }: { rows: EmployeeSalaryRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [editingEmployee, setEditingEmployee] = React.useState<EmployeeSalaryRow | null>(null);
  const [salaryAmount, setSalaryAmount] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("");
  const [saving, setSaving] = React.useState(false);

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

  function openEditDialog(employee: EmployeeSalaryRow) {
    setEditingEmployee(employee);
    setSalaryAmount(employee.salaryAmount > 0 ? String(employee.salaryAmount) : "");
    setEffectiveFrom(employee.effectiveFrom || new Date().toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!editingEmployee) return;

    const amount = Number(salaryAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid salary amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sfa/hr/employee-salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: editingEmployee._id,
          salaryAmount: amount,
          effectiveFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update salary");
        return;
      }

      toast.success("Salary updated successfully");
      setEditingEmployee(null);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
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
            placeholder="Search employees"
            className="pl-9"
          />
        </div>
        <span className="text-muted-foreground text-sm">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row._id}>
                <TableCell className="font-medium">{row.employeeCode}</TableCell>
                <TableCell>{row.employeeName}</TableCell>
                <TableCell>{row.designation || "-"}</TableCell>
                <TableCell>{row.contactNo || "-"}</TableCell>
                <TableCell>
                  {row.salaryAmount > 0 ? (
                    <span className="font-semibold text-green-600">
                      ₹{row.salaryAmount.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  {row.effectiveFrom
                    ? new Date(row.effectiveFrom).toLocaleDateString("en-IN")
                    : "-"}
                </TableCell>
                <TableCell>{row.updatedBy || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(row)}
                  >
                    <Edit2 />
                    {row.salaryAmount > 0 ? "Edit" : "Set Salary"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Monthly Salary</DialogTitle>
            <DialogDescription>
              Update the monthly salary amount for {editingEmployee?.employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="salary">Monthly Salary Amount</Label>
              <div className="relative">
                <IndianRupee className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="salary"
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  placeholder="e.g., 25000"
                  className="pl-9"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEmployee(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
