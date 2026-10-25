import { FileCheck, FileX, Hourglass, Users } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { LedgerStat, LedgerTable, UserFilter } from "@/components/payment-ledger";
import { PageHeader } from "@/components/sfa/page-header";
import { connectToDatabase } from "@/lib/mongodb";
import { formatRupees, loadLedger, summarizeByUser } from "@/lib/payment-ledger";

export default async function SurveyCompletionReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, status } = await searchParams;
  const selectedUser = typeof user === "string" ? user : undefined;
  const selectedStatus = typeof status === "string" ? status : undefined;

  await connectToDatabase();
  const ledger = await loadLedger();
  const users = await summarizeByUser(ledger);

  // Filter by user and status
  const filtered = ledger.filter((payment) => {
    const matchesUser = !selectedUser || payment.user.username === selectedUser;
    let matchesStatus = true;

    if (selectedStatus === "completed") {
      matchesStatus = payment.stage !== "awaiting-survey";
    } else if (selectedStatus === "pending") {
      matchesStatus = payment.stage === "awaiting-survey";
    }

    return matchesUser && matchesStatus;
  });

  const completed = filtered.filter((p) => p.stage !== "awaiting-survey");
  const pending = filtered.filter((p) => p.stage === "awaiting-survey");

  const completedAmount = completed.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
  const uniqueDoctors = new Set(filtered.map((p) => p.doctorId)).size;
  const activeUsers = new Set(filtered.map((p) => p.user.username)).size;

  const selectedName = users.find((u) => u.username === selectedUser)?.name;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <AutoRefresh />
      <PageHeader
        title="Survey Completion Report"
        description={`Track survey form completion status${selectedName ? ` by ${selectedName}` : " across all users"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <LedgerStat
          label="Surveys completed"
          value={completed.length.toLocaleString("en-IN")}
          detail={formatRupees(completedAmount)}
          icon={FileCheck}
          tone="bg-green-50 text-green-700"
        />
        <LedgerStat
          label="Surveys pending"
          value={pending.length.toLocaleString("en-IN")}
          detail={formatRupees(pendingAmount)}
          icon={Hourglass}
          tone="bg-amber-50 text-amber-700"
        />
        <LedgerStat
          label="Unique doctors"
          value={uniqueDoctors.toLocaleString("en-IN")}
          icon={FileX}
          tone="bg-blue-50 text-blue-700"
        />
        <LedgerStat
          label="Active users"
          value={activeUsers.toLocaleString("en-IN")}
          icon={Users}
          tone="bg-violet-50 text-violet-700"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <UserFilter basePath="/survey-reports/survey-completion" users={users} selected={selectedUser} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Survey Status</label>
          <select
            className="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            value={selectedStatus || "all"}
            onChange={(e) => {
              const params = new URLSearchParams();
              if (selectedUser) params.set("user", selectedUser);
              if (e.target.value !== "all") params.set("status", e.target.value);
              const query = params.toString();
              window.location.href = `/survey-reports/survey-completion${query ? `?${query}` : ""}`;
            }}
          >
            <option value="all">All surveys</option>
            <option value="completed">Completed surveys</option>
            <option value="pending">Pending surveys</option>
          </select>
        </div>
      </div>

      <LedgerTable
        payments={filtered}
        kind="pending"
        showUser={!selectedUser}
        emptyMessage="No survey records found."
      />
    </div>
  );
}
