"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RegistrationFormValues = {
  doctorName: string;
  doctorAddress: string;
  doctorQualification: string;
  registrationNumber: string;
  mobileNumber: string;
  hospitalName: string;
  hospitalAddress: string;
  doctorPanNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankBranchName: string;
};

export const emptyRegistrationForm: RegistrationFormValues = {
  doctorName: "",
  doctorAddress: "",
  doctorQualification: "",
  registrationNumber: "",
  mobileNumber: "",
  hospitalName: "",
  hospitalAddress: "",
  doctorPanNumber: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfscCode: "",
  bankBranchName: "",
};

export function buildRegistrationPayload(form: RegistrationFormValues) {
  return {
    doctorName: form.doctorName,
    doctorAddress: form.doctorAddress,
    doctorQualification: form.doctorQualification,
    registrationNumber: form.registrationNumber,
    mobileNumber: form.mobileNumber,
    hospitalName: form.hospitalName,
    hospitalAddress: form.hospitalAddress,
    doctorPanNumber: form.doctorPanNumber,
    bankDetails: {
      bankName: form.bankName,
      accountNumber: form.bankAccountNumber,
      ifscCode: form.bankIfscCode,
      branchName: form.bankBranchName,
    },
  };
}

export function RegistrationFormFields({
  form,
  updateField,
  idPrefix = "",
}: {
  form: RegistrationFormValues;
  updateField: (field: keyof RegistrationFormValues, value: string) => void;
  idPrefix?: string;
}) {
  return (
    <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}doctorName`}>Doctor Name</Label>
        <Input
          id={`${idPrefix}doctorName`}
          value={form.doctorName}
          onChange={(e) => updateField("doctorName", e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}doctorQualification`}>
          Doctor Qualification{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}doctorQualification`}
          value={form.doctorQualification}
          onChange={(e) =>
            updateField("doctorQualification", e.target.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}registrationNumber`}>
          Doctor Registration Number
        </Label>
        <Input
          id={`${idPrefix}registrationNumber`}
          value={form.registrationNumber}
          onChange={(e) =>
            updateField("registrationNumber", e.target.value)
          }
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}mobileNumber`}>
          Mobile Number{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}mobileNumber`}
          type="tel"
          value={form.mobileNumber}
          onChange={(e) => updateField("mobileNumber", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}doctorAddress`}>
          Doctor Address{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`${idPrefix}doctorAddress`}
          value={form.doctorAddress}
          onChange={(e) => updateField("doctorAddress", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}doctorPanNumber`}>
          Doctor PAN Number{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}doctorPanNumber`}
          value={form.doctorPanNumber}
          onChange={(e) =>
            updateField("doctorPanNumber", e.target.value.toUpperCase())
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}hospitalName`}>
          Hospital Name{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}hospitalName`}
          value={form.hospitalName}
          onChange={(e) => updateField("hospitalName", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}hospitalAddress`}>
          Hospital Address{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`${idPrefix}hospitalAddress`}
          value={form.hospitalAddress}
          onChange={(e) => updateField("hospitalAddress", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-2 rounded-lg border p-3">
        <p className="text-sm font-medium">
          Doctor Bank Details{" "}
          <span className="text-muted-foreground font-normal">
            (optional)
          </span>
        </p>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}bankName`}>Bank Name</Label>
          <Input
            id={`${idPrefix}bankName`}
            value={form.bankName}
            onChange={(e) => updateField("bankName", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}bankAccountNumber`}>
            Account Number
          </Label>
          <Input
            id={`${idPrefix}bankAccountNumber`}
            value={form.bankAccountNumber}
            onChange={(e) =>
              updateField("bankAccountNumber", e.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}bankIfscCode`}>IFSC Code</Label>
          <Input
            id={`${idPrefix}bankIfscCode`}
            value={form.bankIfscCode}
            onChange={(e) =>
              updateField("bankIfscCode", e.target.value.toUpperCase())
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}bankBranchName`}>Branch Name</Label>
          <Input
            id={`${idPrefix}bankBranchName`}
            value={form.bankBranchName}
            onChange={(e) => updateField("bankBranchName", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
