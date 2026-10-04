/** Date-range and employee filter shared by every report screen. */
export type ReportParams = { from?: string; to?: string; employee?: string };

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Defaults to the current month when the URL carries no range. */
export function resolveRange(params: ReportParams) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    from: params.from || isoDay(monthStart),
    to: params.to || isoDay(today),
    employee: params.employee ?? "",
  };
}
