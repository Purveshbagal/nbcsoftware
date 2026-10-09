import { Hourglass, Stethoscope, Users } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { LedgerStat, LedgerTable, UserFilter } from "@/components/payment-ledger";
import { connectToDatabase } from "@/lib/mongodb";
import { formatRupees, isPaid, loadLedger, summarizeByUser } from "@/lib/payment-ledger";

export default async function PendingPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user } = await searchParams;
  const selected = typeof user === "string" ? user : undefined;

  await connectToDatabase();
  const ledger = await loadLedger();
  const users = await summarizeByUser(ledger);
  const pending = ledger.filter(
    (payment) => !isPaid(payment) && (!selected || payment.user.username === selected)
  );

  const total = pending.reduce((sum, payment) => sum + payment.amount, 0);
  const doctors = new Set(pending.map((payment) => payment.doctorId)).size;
  const owingUsers = new Set(pending.map((payment) => payment.user.username)).size;
  const selectedName = users.find((u) => u.username === selected)?.name;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <AutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pending Payments</h2>
        <p className="text-muted-foreground text-sm">
          Approved payments not yet given to the doctor
          {selectedName ? ` by ${selectedName}` : ", across all users"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <LedgerStat
          label="Total pending"
          value={formatRupees(total)}
          detail={`${pending.length} ${pending.length === 1 ? "payment" : "payments"}`}
          icon={Hourglass}
          tone="bg-amber-50 text-amber-700"
        />
        <LedgerStat
          label="Doctors waiting"
          value={doctors.toLocaleString("en-IN")}
          icon={Stethoscope}
          tone="bg-blue-50 text-blue-700"
        />
        <LedgerStat
          label="Users with pending"
          value={owingUsers.toLocaleString("en-IN")}
          icon={Users}
          tone="bg-violet-50 text-violet-700"
        />
      </div>

      <UserFilter basePath="/payment/pending" users={users} selected={selected} />

      <LedgerTable
        payments={pending}
        kind="pending"
        showUser={!selected}
        emptyMessage="No pending payments."
      />
    </div>
  );
}
