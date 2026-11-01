"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type LeaveRow = {
  _id: string;
  employeeCode: string;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewedBy: string;
  createdAt: string;
};

export function LeaveRequestTable({ rows }: { rows: LeaveRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<LeaveRow | null>(null);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [remarks, setRemarks] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleReview(status: "approved" | "rejected") {
    if (!selected) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/sfa/hr/leave-request/${selected._id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewRemarks: remarks }),
      });

      if (!res.ok) {
        toast.error("Failed to review");
        return;
      }

      toast.success(`Leave ${status}`);
      setReviewOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
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
                <TableCell>
                  <Badge variant={row.leaveType === "paid_leave" ? "default" : "secondary"}>
                    {row.leaveType === "paid_leave" ? "Paid Leave" : "Leave"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(row.fromDate).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{new Date(row.toDate).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{row.totalDays}</TableCell>
                <TableCell className="max-w-xs truncate">{row.reason}</TableCell>
                <TableCell>
                  <Badge variant={
                    row.status === "approved" ? "default" :
                    row.status === "rejected" ? "destructive" : "secondary"
                  }>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleDateString("en-IN")}</TableCell>
                <TableCell className="text-right">
                  {row.status === "pending" ? (
                    <Button size="sm" onClick={() => { setSelected(row); setReviewOpen(true); setRemarks(""); }}>
                      Review
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">{row.reviewedBy}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div><b>Employee:</b> {selected.employeeName}</div>
                <div><b>Type:</b> {selected.leaveType === "paid_leave" ? "Paid Leave" : "Leave"}</div>
                <div><b>Dates:</b> {new Date(selected.fromDate).toLocaleDateString("en-IN")} to {new Date(selected.toDate).toLocaleDateString("en-IN")}</div>
                <div><b>Days:</b> {selected.totalDays}</div>
                <div><b>Reason:</b> {selected.reason}</div>
              </div>
              <div className="grid gap-2">
                <Label>Remarks (Optional)</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => handleReview("rejected")} disabled={saving}>
              <XCircle />
              Reject
            </Button>
            <Button onClick={() => handleReview("approved")} disabled={saving}>
              <CheckCircle />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
