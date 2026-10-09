import PaymentModel from "@/models/Payment";
import UserModel from "@/models/User";

/**
 * Where an approved payment is on its way to the doctor. Only approved
 * requests count as money owed; pending-review and rejected requests do not.
 */
export type LedgerStage =
  | "awaiting-survey"
  | "awaiting-admin"
  | "ready-to-give"
  | "given";

export const STAGE_LABEL: Record<LedgerStage, string> = {
  "awaiting-survey": "Awaiting survey",
  "awaiting-admin": "Awaiting admin payment",
  "ready-to-give": "Ready to give",
  given: "Given",
};

export type LedgerPayment = {
  id: string;
  doctorId: string;
  doctorName: string;
  productName: string;
  /** Net amount once the admin has deducted TDS, otherwise the requested amount. */
  amount: number;
  stage: LedgerStage;
  user: { username: string; name: string };
  receiptNumber?: string;
  createdAt?: Date;
  givenAt?: Date;
};

export type UserLedgerSummary = {
  username: string;
  name: string;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
};

export type LedgerTotals = {
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
};

type LedgerDoc = {
  _id: { toString(): string };
  doctorId?: string;
  doctorName?: string;
  productName?: string;
  amount: number;
  netAmount?: number | null;
  requestedBy?: { username?: string; name?: string };
  surveyUpload?: { uploadedAt?: Date | null };
  receiptNumber?: string | null;
  createdAt?: Date;
  paidAt?: Date | null;
  handedOverAt?: Date | null;
};

function stageOf(doc: LedgerDoc): LedgerStage {
  if (doc.handedOverAt) return "given";
  if (doc.paidAt) return "ready-to-give";
  if (doc.surveyUpload?.uploadedAt) return "awaiting-admin";
  return "awaiting-survey";
}

/** Approved payments, optionally for one field user, newest first. */
export async function loadLedger(username?: string): Promise<LedgerPayment[]> {
  const query: Record<string, unknown> = { status: "approved" };
  if (username) query["requestedBy.username"] = username;

  // The uploaded survey file is stored inline, so leave it out of the read.
  const docs = (await PaymentModel.find(query)
    .select("-surveyUpload.data")
    .sort({ createdAt: -1 })
    .lean()) as unknown as LedgerDoc[];

  return docs.map((doc) => ({
    id: doc._id.toString(),
    doctorId: doc.doctorId ?? "",
    doctorName: doc.doctorName ?? "",
    productName: doc.productName ?? "",
    amount: doc.netAmount ?? doc.amount,
    stage: stageOf(doc),
    user: {
      username: doc.requestedBy?.username ?? "",
      name: doc.requestedBy?.name ?? doc.requestedBy?.username ?? "-",
    },
    receiptNumber: doc.receiptNumber ?? undefined,
    createdAt: doc.createdAt,
    givenAt: doc.handedOverAt ?? undefined,
  }));
}

export function isPaid(payment: LedgerPayment) {
  return payment.stage === "given";
}

export function totalsOf(payments: LedgerPayment[]): LedgerTotals {
  const totals = { paidAmount: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 };
  for (const payment of payments) {
    if (isPaid(payment)) {
      totals.paidAmount += payment.amount;
      totals.paidCount += 1;
    } else {
      totals.pendingAmount += payment.amount;
      totals.pendingCount += 1;
    }
  }
  return totals;
}

/**
 * Per field user totals. Every active field user is listed, including those
 * with no payments yet, so the admin sees the whole team.
 */
export async function summarizeByUser(
  payments: LedgerPayment[]
): Promise<UserLedgerSummary[]> {
  const fieldUsers = (await UserModel.find({ role: "field", isActive: true })
    .select("username name")
    .lean()) as unknown as { username: string; name?: string }[];

  const byUser = new Map<string, UserLedgerSummary>();
  const entry = (username: string, name: string) => {
    let summary = byUser.get(username);
    if (!summary) {
      summary = { username, name, paidAmount: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 };
      byUser.set(username, summary);
    }
    return summary;
  };

  for (const user of fieldUsers) entry(user.username, user.name || user.username);
  for (const payment of payments) {
    const summary = entry(payment.user.username, payment.user.name);
    if (isPaid(payment)) {
      summary.paidAmount += payment.amount;
      summary.paidCount += 1;
    } else {
      summary.pendingAmount += payment.amount;
      summary.pendingCount += 1;
    }
  }

  return [...byUser.values()].sort(
    (a, b) =>
      b.pendingAmount + b.paidAmount - (a.pendingAmount + a.paidAmount) ||
      a.name.localeCompare(b.name)
  );
}

export function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}
