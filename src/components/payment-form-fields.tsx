"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProductRecord } from "@/types/product";
import type { RegistrationRecord } from "@/types/registration";

export type PaymentFormValues = {
  doctorId: string;
  productId: string;
  amount: string;
  purpose: string;
};

export const emptyPaymentForm: PaymentFormValues = {
  doctorId: "",
  productId: "",
  amount: "",
  purpose: "",
};

export function buildPaymentPayload(form: PaymentFormValues) {
  return {
    doctorId: form.doctorId,
    productId: form.productId,
    amount: form.amount,
    purpose: form.purpose,
  };
}

export function PaymentFormFields({
  form,
  updateField,
  doctors,
  products,
  idPrefix = "",
}: {
  form: PaymentFormValues;
  updateField: (field: keyof PaymentFormValues, value: string) => void;
  doctors: RegistrationRecord[];
  products: ProductRecord[];
  idPrefix?: string;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}doctorId`}>Doctor</Label>
        <Select
          value={form.doctorId || null}
          onValueChange={(value) => updateField("doctorId", (value as string) ?? "")}
        >
          <SelectTrigger id={`${idPrefix}doctorId`} className="w-full">
            <SelectValue placeholder="Select an approved doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                No approved doctors yet
              </div>
            ) : (
              doctors.map((doctor) => (
                <SelectItem key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.doctorName} ({doctor.doctorId})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}productId`}>Product</Label>
        <Select
          value={form.productId || null}
          onValueChange={(value) => updateField("productId", (value as string) ?? "")}
        >
          <SelectTrigger id={`${idPrefix}productId`} className="w-full">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product._id} value={product._id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}amount`}>Amount (₹)</Label>
        <Input
          id={`${idPrefix}amount`}
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => updateField("amount", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}purpose`}>
          Purpose / Notes{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`${idPrefix}purpose`}
          value={form.purpose}
          onChange={(e) => updateField("purpose", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
