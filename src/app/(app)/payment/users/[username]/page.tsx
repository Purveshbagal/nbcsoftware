import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeIndianRupee, Hourglass, Wallet } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { LedgerStat, LedgerTable } from "@/components/payment-ledger";
import { connectToDatabase } from "@/lib/mongodb";
import { formatRupees, isPaid, loadLedger, totalsOf } from "@/lib/payment-ledger";
import UserModel from "@/models/User";

/** One field user's payments: what they owe doctors and what they have given. */
export default async function UserPaymentsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const raw = (await params).username;
  let username = raw;
  try {
    username = decodeURIComponent(raw);
  } catch {
    // Already decoded, or a literal "%" in the username.
  }

  await connectToDatabase();
  const [user, ledger] = await Promise.all([
    UserModel.findOne({ username }).select("name username").lean() as Promise<{
      name?: string;
      username: string;
    } | null>,
    loadLedger(username),
  ]);
  if (!user && ledger.length === 0) notFound();

  const name = user?.name || ledger[0]?.user.name || username;
  const totals = totalsOf(ledger);
  const pending = ledger.filter((payment) => !isPaid(payment));
  const paid = ledger
    .filter(isPaid)
    .sort((a, b) => (b.givenAt?.getTime() ?? 0) - (a.givenAt?.getTime() ?? 0));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <AutoRefresh />
      <div>
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">{name}</h2>
        <p className="text-muted-foreground text-sm">
          <span className="font-mono">{username}</span> · payments to doctors
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <LedgerStat
          label="Total to give"
          value={formatRupees(totals.paidAmount + totals.pendingAmount)}
          detail={`${ledger.length} approved ${ledger.length === 1 ? "payment" : "payments"}`}
          icon={Wallet}
          tone="bg-blue-50 text-blue-700"
        />
        <LedgerStat
          label="Paid"
          value={formatRupees(totals.paidAmount)}
          detail={`${totals.paidCount} given to doctors`}
          icon={BadgeIndianRupee}
          tone="bg-teal-50 text-teal-700"
        />
        <LedgerStat
          label="Pending"
          value={formatRupees(totals.pendingAmount)}
          detail={`${totals.pendingCount} still to give`}
          icon={Hourglass}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Pending — doctors still to be paid</h3>
        <LedgerTable
          payments={pending}
          kind="pending"
          showUser={false}
          emptyMessage="Nothing pending for this user."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Paid — doctors given payment</h3>
        <LedgerTable
          payments={paid}
          kind="paid"
          showUser={false}
          emptyMessage="This user has not given any payments yet."
        />
      </section>
    </div>
  );
}
