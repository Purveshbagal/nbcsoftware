import { PageHeader } from "@/components/sfa/page-header";
import { PendingSalaryTable } from "@/components/sfa/pending-salary-table";

export default function PendingSalaryPage() {
  // Get current month as default
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Pending Salary"
        description="Monthly salary calculation with present days, absent days, paid leave, and deductions. Select month to view pending salaries."
      />
      <PendingSalaryTable defaultMonth={currentMonth} />
    </div>
  );
}
