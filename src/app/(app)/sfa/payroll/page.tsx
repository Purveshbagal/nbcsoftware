import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function PayrollPage() {
  return (
    <ModulePlaceholder
      title="PayRoll"
      summary="Monthly salary processing for the field team."
      willInclude={[
        "Salary structure per employee: basic, allowances and deductions",
        "Attendance and leave feeding into payable days",
        "Approved expense claims carried into the payout",
        "Payslip generation and a monthly payroll register",
      ]}
      related={[
        { href: "/sfa/people/employees", label: "Employees" },
        { href: "/sfa/hr/leave", label: "Leave Management" },
        { href: "/sfa/expense", label: "Expenses" },
      ]}
    />
  );
}
