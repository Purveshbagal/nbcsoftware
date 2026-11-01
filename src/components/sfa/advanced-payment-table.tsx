"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Eye, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type AdvanceRow = {
  _id: string;
  employeeCode: string;
  employeeName: string;
  advanceAmount: number;
  paymentType: string;
  givenDate: string;
  totalDeducted: number;
  remainingAmount: number;
  status: string;
  installments: any[];
};

export function AdvancedPaymentTable({ rows, employees }: { rows: AdvanceRow[]; employees: any[] }) {
  const router = useRouter();
  const [giveOpen, setGiveOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedAdvance, setSelectedAdvance] = React.useState<AdvanceRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [employeeId, setEmployeeId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentType, setPaymentType] = React.useState("one_time");
  const [installmentAmount, setInstallmentAmount] = React.useState("");
  const [installmentFromMonth, setInstallmentFromMonth] = React.useState("");
  const [deductFromMonth, setDeductFromMonth] = React.useState("");

  const monthOptions = React.useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  async function handleGive() {
    if (!employeeId || !amount) {
      toast.error("Please fill required fields");
      return;
    }

    const body: any = { employeeId, advanceAmount: Number(amount), paymentType };

    if (paymentType === "one_time") {
      if (!deductFromMonth) {
        toast.error("Select deduction month");
        return;
      }
      body.deductFromMonth = deductFromMonth;
    } else {
      if (!installmentAmount || !installmentFromMonth) {
        toast.error("Fill installment details");
        return;
      }
      body.installmentAmount = Number(installmentAmount);
      body.installmentFromMonth = installmentFromMonth;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sfa/hr/advanced-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success("Advance given successfully");
      setGiveOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to give advance");
    } finally {
      setSaving(false);
    }
  }

  async function handlePassMonth(installmentIndex: number, addToNext: boolean) {
    if (!selectedAdvance) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sfa/hr/advanced-payment/${selectedAdvance._id}/pass-month`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentIndex, addToNext }),
      });
      if (!res.ok) {
        toast.error("Failed to pass month");
        return;
      }
      toast.success("Month passed");
      router.refresh();
      setDetailsOpen(false);
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleForceClose() {
    if (!selectedAdvance) return;
    if (!confirm("Close this advance? Remaining amount will be forgiven.")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/sfa/hr/advanced-payment/${selectedAdvance._id}/force-close`, {
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success("Advance closed");
      router.refresh();
      setDetailsOpen(false);
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  const totalMonths = amount && installmentAmount ? Math.ceil(Number(amount) / Number(installmentAmount)) : 0;

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setGiveOpen(true)}>
          <Plus />
          Give Advanced
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Given Date</TableHead>
              <TableHead className="text-right">Deducted</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{row.employeeName}</div>
                    <div className="text-sm text-muted-foreground">{row.employeeCode}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">₹{row.advanceAmount.toLocaleString("en-IN")}</TableCell>
                <TableCell className="capitalize">{row.paymentType.replace("_", " ")}</TableCell>
                <TableCell>{new Date(row.givenDate).toLocaleDateString("en-IN")}</TableCell>
                <TableCell className="text-right">₹{row.totalDeducted.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right">₹{row.remainingAmount.toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "active" ? "default" : row.status === "completed" ? "secondary" : "outline"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedAdvance(row); setDetailsOpen(true); }}>
                    <Eye />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Give Dialog */}
      <Dialog open={giveOpen} onOpenChange={setGiveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Give Advanced Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Employee *</Label>
              <Select value={employeeId} onValueChange={(value) => value && setEmployeeId(value)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e._id} value={e._id}>{e.name} ({e.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Advance Amount *</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹" />
            </div>
            <div className="grid gap-2">
              <Label>Payment Type *</Label>
              <Select value={paymentType} onValueChange={(value) => value && setPaymentType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time Deduction</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === "one_time" ? (
              <div className="grid gap-2">
                <Label>Deduct from Month *</Label>
                <Select value={deductFromMonth} onValueChange={(value) => value && setDeductFromMonth(value)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Per Month Installment *</Label>
                  <Input type="number" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Start from Month *</Label>
                  <Select value={installmentFromMonth} onValueChange={(value) => value && setInstallmentFromMonth(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {totalMonths > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {totalMonths} installments of ₹{Number(installmentAmount).toLocaleString("en-IN")}
                  </p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiveOpen(false)}>Cancel</Button>
            <Button onClick={handleGive} disabled={saving}>
              {saving ? "Processing..." : "Confirm & Give"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advance Details - {selectedAdvance?.employeeName}</DialogTitle>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Amount:</span> <b>₹{selectedAdvance.advanceAmount.toLocaleString("en-IN")}</b></div>
                <div><span className="text-muted-foreground">Type:</span> <b className="capitalize">{selectedAdvance.paymentType.replace("_", " ")}</b></div>
                <div><span className="text-muted-foreground">Deducted:</span> <b>₹{selectedAdvance.totalDeducted.toLocaleString("en-IN")}</b></div>
                <div><span className="text-muted-foreground">Remaining:</span> <b>₹{selectedAdvance.remainingAmount.toLocaleString("en-IN")}</b></div>
              </div>

              {selectedAdvance.paymentType === "installment" && selectedAdvance.installments.length > 0 && (
                <>
                  <h4 className="font-semibold">Installments</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAdvance.installments.map((inst: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(inst.month + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</TableCell>
                          <TableCell className="text-right">₹{inst.amount.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <Badge variant={inst.status === "pending" ? "secondary" : inst.status === "deducted" ? "default" : "outline"}>
                              {inst.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {inst.status === "pending" && selectedAdvance.status === "active" && (
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => {
                                  if (confirm("Add to next month?")) handlePassMonth(idx, true);
                                  else handlePassMonth(idx, false);
                                }}>
                                  Pass
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {selectedAdvance.status === "active" && (
                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={handleForceClose} disabled={saving}>
                    <X />
                    Force Close Advance
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
