import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function InsurancePage() {
  return (
    <ModulePlaceholder
      title="Insurance"
      summary="Policies held for employees, and claims raised against them."
      willInclude={[
        "Policy records: insurer, policy number, cover, premium and renewal date",
        "Which employees are covered by which policy",
        "Claims raised, with their status and settled amount",
        "Renewal reminders",
      ]}
      related={[{ href: "/sfa/people/employees", label: "Employees" }]}
    />
  );
}
