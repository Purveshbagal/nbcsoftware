"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeIndianRupee, Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentRecord } from "@/types/payment";

export function GivePaymentDialog({
  eligiblePayments,
}: {
  eligiblePayments: PaymentRecord[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [paymentId, setPaymentId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const selected = eligiblePayments.find((p) => p._id === paymentId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!paymentId) {
      setError("Please select a doctor");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/payments/${paymentId}/give-payment`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Failed to give payment");
        return;
      }

      toast.success("Payment given and receipt generated.");
      setPaymentId(null);
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
          setPaymentId(null);
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <BadgeIndianRupee />
        Give
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Give Payment</DialogTitle>
            <DialogDescription>
              Select a doctor whose survey form has been uploaded and is
              ready for disbursement. A receipt will be generated
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Select
              value={paymentId}
              onValueChange={(value) => setPaymentId(value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {eligiblePayments.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">
                    No payments are ready for disbursement
                  </div>
                ) : (
                  eligiblePayments.map((payment) => (
                    <SelectItem key={payment._id} value={payment._id}>
                      {payment.doctorName} — {payment.productName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Amount (₹)</label>
            <div className="bg-muted rounded-lg border px-3 py-2 text-sm">
              {selected ? selected.amount.toLocaleString("en-IN") : "-"}
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading || !paymentId}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Give &amp; Generate Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
