"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
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
import { EntityTable } from "@/components/sfa/entity-table";
import type { Column, EntityRow, Field, FilterSpec } from "@/lib/sfa-ui";

interface SampleRequestTableProps {
  endpoint: string;
  rows: EntityRow[];
  columns: Column[];
  fields: Field[];
  filters: FilterSpec[];
  employees: string[];
}

export function SampleRequestTable({
  endpoint,
  rows,
  columns,
  fields,
  filters,
}: SampleRequestTableProps) {
  const router = useRouter();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<EntityRow | null>(null);
  const [editedQuantity, setEditedQuantity] = React.useState<number>(0);
  const [approving, setApproving] = React.useState(false);

  // Enhanced columns with Approve action
  const enhancedColumns: Column[] = [
    ...columns,
    {
      key: "_actions",
      label: "Actions",
      render: (row: EntityRow) => {
        const status = row.status as string;
        if (status === "pending") {
          return (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleApproveClick(row)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="size-4" />
              Approve
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const handleApproveClick = (row: EntityRow) => {
    setSelectedRequest(row);
    setEditedQuantity(Number(row.quantity) || 0);
    setApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (!editedQuantity || editedQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setApproving(true);

    try {
      const res = await fetch(`${endpoint}/${selectedRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          quantity: editedQuantity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to approve request");
      }

      toast.success(`Request approved with quantity ${editedQuantity}`);
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve request");
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <EntityTable
        endpoint={endpoint}
        entityName="Request"
        labelKey="item"
        rows={rows}
        columns={enhancedColumns}
        fields={fields}
        filters={filters}
      />

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Sample Request</DialogTitle>
            <DialogDescription>
              Review and edit the quantity before approving this request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Employee</Label>
                <div className="text-sm text-muted-foreground">
                  {String(selectedRequest.employeeName || "-")}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Item</Label>
                <div className="text-sm text-muted-foreground">
                  {String(selectedRequest.item || "-")}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Item Type</Label>
                <div className="text-sm text-muted-foreground">
                  {String(selectedRequest.itemType || "-")}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={editedQuantity}
                  onChange={(e) => setEditedQuantity(Number(e.target.value))}
                  placeholder="Enter approved quantity"
                  autoFocus
                />
              </div>

              {selectedRequest.remarks ? (
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Remarks</Label>
                  <div className="text-sm text-muted-foreground">
                    {String(selectedRequest.remarks)}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {approving && <Loader2 className="size-4 animate-spin" />}
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
