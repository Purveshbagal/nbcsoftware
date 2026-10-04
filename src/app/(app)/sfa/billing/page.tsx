import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function BillingPage() {
  return (
    <ModulePlaceholder
      title="Account & Billing"
      summary="What this workspace itself costs — licence count, plan and invoices."
      willInclude={[
        "Active user licences against the licences purchased",
        "Current plan and renewal date",
        "Invoices and payment history for the subscription",
      ]}
      related={[
        { href: "/sfa/people/employees", label: "Employees" },
        { href: "/sfa/people/administrators", label: "Administrators" },
      ]}
    />
  );
}
