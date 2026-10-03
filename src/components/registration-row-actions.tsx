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
  buildRegistrationPayload,
  RegistrationFormFields,
  type RegistrationFormValues,
} from "@/components/registration-form-fields";
import type { RegistrationRecord } from "@/types/registration";

function toFormValues(registration: RegistrationRecord): RegistrationFormValues {
  return {
    doctorName: registration.doctorName,
    doctorAddress: registration.doctorAddress ?? "",
    doctorQualification: registration.doctorQualification ?? "",
    registrationNumber: registration.registrationNumber,
    mobileNumber: registration.mobileNumber ?? "",
    hospitalName: registration.hospitalName ?? "",
    hospitalAddress: registration.hospitalAddress ?? "",
    doctorPanNumber: registration.doctorPanNumber ?? "",
    bankName: registration.bankDetails?.bankName ?? "",
    bankAccountNumber: registration.bankDetails?.accountNumber ?? "",
    bankIfscCode: registration.bankDetails?.ifscCode ?? "",
    bankBranchName: registration.bankDetails?.branchName ?? "",
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

export function RegistrationRowActions({
  registration,
}: {
  registration: RegistrationRecord;
}) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState<RegistrationFormValues>(() =>
    toFormValues(registration)
  );
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editSaving, setEditSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [pending, setPending] = React.useState<"approved" | "rejected" | null>(
    null
  );

  function updateEditField(field: keyof RegistrationFormValues, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function openEdit() {
    setEditForm(toFormValues(registration));
    setEditError(null);
    setEditOpen(true);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEditError(null);
    setEditSaving(true);

    try {
      const res = await fetch(`/api/registrations/${registration._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegistrationPayload(editForm)),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEditError(data.error ?? "Failed to update registration");
        return;
      }

      toast.success("Registration updated.");
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
      const res = await fetch(`/api/registrations/${registration._id}`, {
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
          ? "Registration approved."
          : "Registration rejected."
      );
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/registrations/${registration._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete registration");
        return;
      }

      toast.success("Registration deleted.");
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
        {registration.status === "pending" && (
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{registration.doctorName}</DialogTitle>
            <DialogDescription>Registration request details</DialogDescription>
          </DialogHeader>
          <dl className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Doctor ID</dt>
              <dd className="col-span-2 font-mono">{registration.doctorId}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Qualification</dt>
              <dd className="col-span-2">
                {registration.doctorQualification || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="col-span-2">
                {registration.doctorAddress || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Registration No.</dt>
              <dd className="col-span-2">{registration.registrationNumber}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Mobile Number</dt>
              <dd className="col-span-2">
                {registration.mobileNumber || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">PAN Number</dt>
              <dd className="col-span-2">
                {registration.doctorPanNumber || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Hospital Name</dt>
              <dd className="col-span-2">{registration.hospitalName || "-"}</dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Hospital Address</dt>
              <dd className="col-span-2">
                {registration.hospitalAddress || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Bank Name</dt>
              <dd className="col-span-2">
                {registration.bankDetails?.bankName || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Bank Account No.</dt>
              <dd className="col-span-2">
                {registration.bankDetails?.accountNumber ?? "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">IFSC Code</dt>
              <dd className="col-span-2">
                {registration.bankDetails?.ifscCode ?? "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Branch Name</dt>
              <dd className="col-span-2">
                {registration.bankDetails?.branchName ?? "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">
                <Badge variant={statusVariant[registration.status]}>
                  {registration.status}
                </Badge>
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Requested By</dt>
              <dd className="col-span-2">
                {registration.requestedBy?.name ?? "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="col-span-2">
                {formatDate(registration.createdAt)}
              </dd>
            </div>
            {registration.status !== "pending" && (
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-muted-foreground">Reviewed By</dt>
                <dd className="col-span-2">
                  {registration.reviewedBy?.name ?? "-"}
                  {registration.reviewedAt
                    ? ` · ${formatDate(registration.reviewedAt)}`
                    : ""}
                </dd>
              </div>
            )}
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Edit Registration</DialogTitle>
              <DialogDescription>
                Update the doctor&apos;s details for {registration.doctorId}.
              </DialogDescription>
            </DialogHeader>

            <RegistrationFormFields
              form={editForm}
              updateField={updateEditField}
              idPrefix="edit-"
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
            <AlertDialogTitle>Delete this registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the registration request for{" "}
              {registration.doctorName}. This action cannot be undone.
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
