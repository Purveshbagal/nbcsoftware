import Link from "next/link";
import { ArrowUpRight, Wallet, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  STAGE_LABEL,
  formatRupees,
  type LedgerPayment,
  type LedgerStage,
  type UserLedgerSummary,
} from "@/lib/payment-ledger";

const stageVariant: Record<LedgerStage, "secondary" | "outline" | "default"> = {
  "awaiting-survey": "secondary",
  "awaiting-admin": "secondary",
  "ready-to-give": "outline",
  given: "default",
};

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function userLedgerHref(username: string) {
  return `/payment/users/${encodeURIComponent(username)}`;
}

export function LedgerStat({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone: string;
  href?: string;
}) {
  const card = (
    <Card className="h-full py-6">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-3 text-3xl font-semibold tabular-nums">{value}</CardTitle>
          {detail ? <p className="text-muted-foreground mt-1 text-xs">{detail}</p> : null}
        </div>
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="size-5" />
        </div>
      </CardHeader>
    </Card>
  );
  if (!href) return card;
  return (
    <Link
      href={href}
      className="rounded-xl outline-offset-4 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-primary"
    >
      {card}
    </Link>
  );
}

function EmptyLedger({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed">
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Wallet className="text-muted-foreground size-6" />
        </div>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

/** Payments to doctors. `kind` decides whether the last date is "requested" or "given". */
export function LedgerTable({
  payments,
  kind,
  showUser = true,
  emptyMessage,
}: {
  payments: LedgerPayment[];
  kind: "pending" | "paid";
  showUser?: boolean;
  emptyMessage: string;
}) {
  if (payments.length === 0) return <EmptyLedger message={emptyMessage} />;

  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const columns = 5 + (showUser ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>Product</TableHead>
            {showUser && <TableHead>User</TableHead>}
            {kind === "paid" ? <TableHead>Receipt No.</TableHead> : <TableHead>Stage</TableHead>}
            <TableHead>{kind === "paid" ? "Given On" : "Requested On"}</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {payment.doctorName || "-"}
                {payment.doctorId ? (
                  <span className="text-muted-foreground ml-1 font-mono text-xs">
                    ({payment.doctorId})
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">{payment.productName || "-"}</TableCell>
              {showUser && (
                <TableCell>
                  <Link
                    href={userLedgerHref(payment.user.username)}
                    className="hover:text-primary underline-offset-4 hover:underline"
                  >
                    {payment.user.name}
                  </Link>
                </TableCell>
              )}
              {kind === "paid" ? (
                <TableCell className="font-mono text-xs">{payment.receiptNumber ?? "-"}</TableCell>
              ) : (
                <TableCell>
                  <Badge variant={stageVariant[payment.stage]}>{STAGE_LABEL[payment.stage]}</Badge>
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {formatDate(kind === "paid" ? payment.givenAt : payment.createdAt)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatRupees(payment.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns - 1} className="font-semibold">
              Total · {payments.length} {payments.length === 1 ? "payment" : "payments"}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatRupees(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

/** One row per field user with what they have given and what is still owed. */
export function UserLedgerTable({ summaries }: { summaries: UserLedgerSummary[] }) {
  if (summaries.length === 0) return <EmptyLedger message="No field users yet." />;

  const totals = summaries.reduce(
    (sum, s) => ({
      paidAmount: sum.paidAmount + s.paidAmount,
      paidCount: sum.paidCount + s.paidCount,
      pendingAmount: sum.pendingAmount + s.pendingAmount,
      pendingCount: sum.pendingCount + s.pendingCount,
    }),
    { paidAmount: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 }
  );

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Pending</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((s) => (
            <TableRow key={s.username}>
              <TableCell>
                <Link href={userLedgerHref(s.username)} className="font-medium hover:text-primary">
                  {s.name}
                </Link>
                <span className="text-muted-foreground ml-2 font-mono text-xs">{s.username}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatRupees(s.paidAmount)}
                <span className="text-muted-foreground ml-1 text-xs">({s.paidCount})</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className={s.pendingAmount > 0 ? "font-medium text-amber-700" : undefined}>
                  {formatRupees(s.pendingAmount)}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">({s.pendingCount})</span>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatRupees(s.paidAmount + s.pendingAmount)}
              </TableCell>
              <TableCell>
                <Link
                  href={userLedgerHref(s.username)}
                  aria-label={`Open ${s.name}`}
                  className="text-muted-foreground hover:text-primary flex justify-end"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">All users</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatRupees(totals.paidAmount)}
              <span className="text-muted-foreground ml-1 text-xs font-normal">({totals.paidCount})</span>
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatRupees(totals.pendingAmount)}
              <span className="text-muted-foreground ml-1 text-xs font-normal">({totals.pendingCount})</span>
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatRupees(totals.paidAmount + totals.pendingAmount)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

/** Filter chips that narrow an all-users list to one user via `?user=`. */
export function UserFilter({
  basePath,
  users,
  selected,
}: {
  basePath: string;
  users: { username: string; name: string }[];
  selected?: string;
}) {
  if (users.length === 0) return null;
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
    }`;
  return (
    <nav aria-label="Filter by user" className="flex flex-wrap gap-2">
      <Link href={basePath} className={chip(!selected)} aria-current={!selected ? "page" : undefined}>
        All users
      </Link>
      {users.map((user) => (
        <Link
          key={user.username}
          href={`${basePath}?user=${encodeURIComponent(user.username)}`}
          className={chip(selected === user.username)}
          aria-current={selected === user.username ? "page" : undefined}
        >
          {user.name}
        </Link>
      ))}
    </nav>
  );
}
