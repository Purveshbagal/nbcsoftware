import { CircleCheckBig, Clock, FileCheck, Hourglass, Users } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { LedgerStat, LedgerTable, UserFilter } from "@/components/payment-ledger";
import { PageHeader } from "@/components/sfa/page-header";
import { SelectFilter } from "@/components/select-filter";
import { connectToDatabase } from "@/lib/mongodb";
import { formatRupees, loadLedger, summarizeByUser, type LedgerStage, STAGE_LABEL } from "@/lib/payment-ledger";

const STAGE_ICONS: Record<LedgerStage, any> = {
  "awaiting-survey": Hourglass,
  "awaiting-admin": FileCheck,
  "ready-to-give": Clock,
  "given": CircleCheckBig,
};

const STAGE_TONES: Record<LedgerStage, string> = {
  "awaiting-survey": "bg-amber-50 text-amber-700",
  "awaiting-admin": "bg-blue-50 text-blue-700",
  "ready-to-give": "bg-purple-50 text-purple-700",
  "given": "bg-green-50 text-green-700",
};

export default async function PaymentWorkflowReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, stage } = await searchParams;
  const selectedUser = typeof user === "string" ? user : undefined;
  const selectedStage = typeof stage === "string" ? (stage as LedgerStage) : undefined;

  await connectToDatabase();
  const ledger = await loadLedger();
  const users = await summarizeByUser(ledger);

  // Filter by user and stage
  const filtered = ledger.filter((payment) => {
    const matchesUser = !selectedUser || payment.user.username === selectedUser;
    const matchesStage = !selectedStage || payment.stage === selectedStage;
    return matchesUser && matchesStage;
  });

  // Group by stage
  const byStage = {
    "awaiting-survey": filtered.filter((p) => p.stage === "awaiting-survey"),
    "awaiting-admin": filtered.filter((p) => p.stage === "awaiting-admin"),
    "ready-to-give": filtered.filter((p) => p.stage === "ready-to-give"),
    "given": filtered.filter((p) => p.stage === "given"),
  };

  const uniqueDoctors = new Set(filtered.map((p) => p.doctorId)).size;
  const activeUsers = new Set(filtered.map((p) => p.user.username)).size;

  const selectedName = users.find((u) => u.username === selectedUser)?.name;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <AutoRefresh />
      <PageHeader
        title="Payment Approval Workflow Report"
        description={`Monitor payment stages from survey upload to disbursement${selectedName ? ` by ${selectedName}` : " across all users"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {(Object.keys(byStage) as LedgerStage[]).map((stage) => {
          const payments = byStage[stage];
          const total = payments.reduce((sum, p) => sum + p.amount, 0);
          return (
            <LedgerStat
              key={stage}
              label={STAGE_LABEL[stage]}
              value={payments.length.toLocaleString("en-IN")}
              detail={formatRupees(total)}
              icon={STAGE_ICONS[stage]}
              tone={STAGE_TONES[stage]}
            />
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LedgerStat
          label="Unique doctors"
          value={uniqueDoctors.toLocaleString("en-IN")}
          icon={Users}
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
        <UserFilter basePath="/survey-reports/payment-workflow" users={users} selected={selectedUser} />

        <SelectFilter
          label="Payment Stage"
          value={selectedStage || "all"}
          options={[
            { value: "all", label: "All stages" },
            ...(Object.keys(STAGE_LABEL) as LedgerStage[]).map((stage) => ({
              value: stage,
              label: STAGE_LABEL[stage],
            })),
          ]}
          basePath="/survey-reports/payment-workflow"
          currentParams={{ user: selectedUser, stage: selectedStage }}
          paramName="stage"
        />
      </div>

      <LedgerTable
        payments={filtered}
        kind="pending"
        showUser={!selectedUser}
        emptyMessage="No payment records found."
      />
    </div>
  );
}
