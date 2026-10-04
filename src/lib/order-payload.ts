const TEXT_FIELDS = [
  "orderNo",
  "orderDate",
  "firm",
  "doctor",
  "employeeName",
  "zone",
  "division",
  "remarks",
  "status",
] as const;

export type OrderLineInput = {
  product: string;
  quantity: number;
  rate: number;
  discount: number;
};

function normaliseLines(raw: unknown): OrderLineInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const line = (entry ?? {}) as Record<string, unknown>;
      return {
        product: String(line.product ?? "").trim(),
        quantity: Number(line.quantity ?? 0) || 0,
        rate: Number(line.rate ?? 0) || 0,
        discount: Number(line.discount ?? 0) || 0,
      };
    })
    .filter((line) => line.product !== "");
}

/**
 * Pick the writable fields off an order request body. On create every field is
 * written; on update only the ones the client sent.
 */
export function normaliseOrderBody(body: Record<string, unknown>, all: boolean) {
  const doc: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    if (!all && !(field in body)) continue;
    doc[field] = String(body[field] ?? "").trim();
  }

  if (all || "lines" in body) {
    doc.lines = normaliseLines(body.lines);
  }

  return doc as Record<string, unknown> & { orderDate?: string };
}

/** Totals are derived from the lines, never trusted from the client. */
export function orderTotals(lines: OrderLineInput[]) {
  return lines.reduce(
    (acc, line) => {
      const amount = line.quantity * line.rate * (1 - line.discount / 100);
      acc.totalQuantity += line.quantity;
      acc.totalAmount += amount;
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0 }
  );
}
