"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildPaymentPayload,
  emptyPaymentForm,
  PaymentFormFields,
  type PaymentFormValues,
} from "@/components/payment-form-fields";
import type { ProductRecord } from "@/types/product";
import type { RegistrationRecord } from "@/types/registration";

export function NewPaymentDialog({
  doctors,
  products,
}: {
  doctors: RegistrationRecord[];
  products: ProductRecord[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyPaymentForm);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function updateField(field: keyof PaymentFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPaymentPayload(form)),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit payment request");
        return;
      }

      toast.success("Payment request submitted for approval.");
      setForm(emptyPaymentForm);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setForm(emptyPaymentForm);
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus />
        New
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New Payment Request</DialogTitle>
            <DialogDescription>
              Submit a payment request for approval.
            </DialogDescription>
          </DialogHeader>

          <PaymentFormFields
            form={form}
            updateField={updateField}
            doctors={doctors}
            products={products}
          />

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
