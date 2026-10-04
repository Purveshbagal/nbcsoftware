"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildPaymentPayload,
  PaymentFormFields,
  type PaymentFormValues,
} from "@/components/payment-form-fields";
import type { PaymentRecord } from "@/types/payment";
import type { ProductRecord } from "@/types/product";
import type { RegistrationRecord } from "@/types/registration";

function toFormValues(payment: PaymentRecord): PaymentFormValues {
  return {
    doctorId: payment.doctorId ?? "",
    productId: payment.productId ?? "",
    amount: String(payment.amount ?? ""),
    purpose: payment.purpose ?? "",
  };
}

const statusVariant: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentRowActions({
  payment,
  doctors,
  products,
}: {
  payment: PaymentRecord;
  doctors: RegistrationRecord[];
  products: ProductRecord[];
}) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState<PaymentFormValues>(() =>
    toFormValues(payment)
  );
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editSaving, setEditSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [pending, setPending] = React.useState<"approved" | "rejected" | null>(
    null
  );

  function updateEditField(field: keyof PaymentFormValues, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function openEdit() {
    setEditForm(toFormValues(payment));
    setEditError(null);
    setEditOpen(true);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEditError(null);
    setEditSaving(true);

    try {
      const res = await fetch(`/api/payments/${payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPaymentPayload(editForm)),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEditError(data.error ?? "Failed to update payment request");
        return;
      }

      toast.success("Payment request updated.");
      setEditOpen(false);
      router.refresh();
    } catch {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setEditSaving(false);
    }
  }

  async function updateStatus(status: "approved" | "rejected") {
    setPending(status);
    try {
      const res = await fetch(`/api/payments/${payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update status");
        return;
      }

      toast.success(
        status === "approved"
          ? "Payment request approved."
          : "Payment request rejected."
      );
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/payments/${payment._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete payment request");
        return;
      }

      toast.success("Payment request deleted.");
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setViewOpen(true)}>
          <Eye />
          View
        </Button>
        <Button size="sm" variant="outline" onClick={openEdit}>
          <Pencil />
          Edit
        </Button>
        {payment.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => updateStatus("approved")}
            >
              {pending === "approved" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={pending !== null}
              onClick={() => updateStatus("rejected")}
            >
              {pending === "rejected" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X />
              )}
              Reject
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
          Delete
        </Button>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{payment.doctorName || "Payment Request"}</DialogTitle>
            <DialogDescription>Payment request details</DialogDescription>
          </DialogHeader>
          <dl className="grid gap-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Doctor ID</dt>
              <dd className="col-span-2 font-mono">
                {payment.doctorId || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Product</dt>
              <dd className="col-span-2">
                {payment.productName || "-"}
                {payment.productComposition ? (
                  <span className="text-muted-foreground block text-xs">
                    {payment.productComposition}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="col-span-2">
                ₹{payment.amount.toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Purpose</dt>
              <dd className="col-span-2">{payment.purpose || "-"}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">
                <Badge variant={statusVariant[payment.status]}>
                  {payment.status}
                </Badge>
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Requested By</dt>
              <dd className="col-span-2">
                {payment.requestedBy?.name ?? "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="col-span-2">{formatDate(payment.createdAt)}</dd>
            </div>
            {payment.status !== "pending" && (
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-muted-foreground">Reviewed By</dt>
                <dd className="col-span-2">
                  {payment.reviewedBy?.name ?? "-"}
                  {payment.reviewedAt
                    ? ` · ${formatDate(payment.reviewedAt)}`
                    : ""}
                </dd>
              </div>
            )}
            {payment.status === "approved" && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground">Survey Form No.</dt>
                  <dd className="col-span-2 font-mono">
                    {payment.surveyFormNo || "Not yet downloaded"}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground">Survey Downloaded</dt>
                  <dd className="col-span-2">
                    {formatDate(payment.surveyDownloadedAt)}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground">Survey Upload</dt>
                  <dd className="col-span-2">
                    {payment.surveyUploaded ? (
                      <a
                        href={`/api/payments/${payment._id}/survey-upload`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        View uploaded file (
                        {formatDate(payment.surveyUploadedAt)})
                      </a>
                    ) : (
                      "Not uploaded yet"
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground">Payment Given</dt>
                  <dd className="col-span-2">
                    {payment.paidAt ? (
                      <a
                        href={`/api/payments/${payment._id}/receipt-pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Receipt {payment.receiptNumber} · ₹
                        {(payment.netAmount ?? payment.amount).toLocaleString(
                          "en-IN"
                        )}{" "}
                        net · {formatDate(payment.paidAt)}
                      </a>
                    ) : (
                      "Not given yet"
                    )}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Edit Payment Request</DialogTitle>
              <DialogDescription>
                Update the details of this payment request.
              </DialogDescription>
            </DialogHeader>

            <PaymentFormFields
              form={editForm}
              updateField={updateEditField}
              doctors={doctors}
              products={products}
              idPrefix="edit-payment-"
            />

            {editError && (
              <p className="text-destructive text-sm" role="alert">
                {editError}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={editSaving}>
                {editSaving && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment request. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
