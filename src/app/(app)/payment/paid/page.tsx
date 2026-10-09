import { BadgeIndianRupee, Stethoscope, Users } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { LedgerStat, LedgerTable, UserFilter } from "@/components/payment-ledger";
import { connectToDatabase } from "@/lib/mongodb";
import { formatRupees, isPaid, loadLedger, summarizeByUser } from "@/lib/payment-ledger";

export default async function PaidPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user } = await searchParams;
  const selected = typeof user === "string" ? user : undefined;

  await connectToDatabase();
  const ledger = await loadLedger();
  const users = await summarizeByUser(ledger);
  const paid = ledger
    .filter((payment) => isPaid(payment) && (!selected || payment.user.username === selected))
    .sort((a, b) => (b.givenAt?.getTime() ?? 0) - (a.givenAt?.getTime() ?? 0));

  const total = paid.reduce((sum, payment) => sum + payment.amount, 0);
  const doctors = new Set(paid.map((payment) => payment.doctorId)).size;
  const givingUsers = new Set(paid.map((payment) => payment.user.username)).size;
  const selectedName = users.find((u) => u.username === selected)?.name;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <AutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Paid Payments</h2>
        <p className="text-muted-foreground text-sm">
          Payments handed over to doctors with OTP confirmation
          {selectedName ? ` by ${selectedName}` : ", across all users"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <LedgerStat
          label="Total paid"
          value={formatRupees(total)}
          detail={`${paid.length} ${paid.length === 1 ? "payment" : "payments"}`}
          icon={BadgeIndianRupee}
          tone="bg-teal-50 text-teal-700"
        />
        <LedgerStat
          label="Doctors paid"
          value={doctors.toLocaleString("en-IN")}
          icon={Stethoscope}
          tone="bg-blue-50 text-blue-700"
        />
        <LedgerStat
          label="Users who paid"
          value={givingUsers.toLocaleString("en-IN")}
          icon={Users}
          tone="bg-violet-50 text-violet-700"
        />
      </div>

      <UserFilter basePath="/payment/paid" users={users} selected={selected} />

      <LedgerTable
        payments={paid}
        kind="paid"
        showUser={!selected}
        emptyMessage="No payments given to doctors yet."
      />
    </div>
  );
}
