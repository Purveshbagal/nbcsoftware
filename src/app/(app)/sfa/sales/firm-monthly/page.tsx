import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import OrderModel from "@/models/Order";

const columns = [
  { key: "month", label: "Month" },
  { key: "firm", label: "Firm" },
  { key: "orders", label: "Orders", numeric: true },
  { key: "quantity", label: "Quantity", numeric: true },
  { key: "value", label: "Value (₹)", numeric: true },
];

export default async function FirmMonthlyPage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const match: Record<string, unknown> = {
    orderDate: { $gte: from, $lte: to },
    status: { $nin: ["cancelled", "draft"] },
  };
  if (employee) match.employeeName = employee;

  const [grouped, employees] = await Promise.all([
    OrderModel.aggregate<{
      _id: { month: string; firm: string };
      orders: number;
      quantity: number;
      value: number;
    }>([
      { $match: match },
      { $unwind: { path: "$lines", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            month: { $substrBytes: ["$orderDate", 0, 7] },
            firm: { $ifNull: ["$firm", "(no firm)"] },
            orderId: "$_id",
          },
          quantity: { $sum: { $ifNull: ["$lines.quantity", 0] } },
          value: {
            $sum: {
              $multiply: [
                { $ifNull: ["$lines.quantity", 0] },
                { $ifNull: ["$lines.rate", 0] },
                { $subtract: [1, { $divide: [{ $ifNull: ["$lines.discount", 0] }, 100] }] },
              ],
            },
          },
        },
      },
      {
        // Collapse the per-order rows into one row per firm per month.
        $group: {
          _id: { month: "$_id.month", firm: "$_id.firm" },
          orders: { $sum: 1 },
          quantity: { $sum: "$quantity" },
          value: { $sum: "$value" },
        },
      },
      { $sort: { "_id.month": 1, "_id.firm": 1 } },
    ]),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = grouped.map((group) => ({
    month: group._id.month,
    firm: group._id.firm,
    orders: group.orders,
    quantity: group.quantity,
    value: Math.round(group.value).toLocaleString("en-IN"),
  }));

  const totals = grouped.reduce(
    (acc, group) => ({
      orders: acc.orders + group.orders,
      quantity: acc.quantity + group.quantity,
      value: acc.value + group.value,
    }),
    { orders: 0, quantity: 0, value: 0 }
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Firm Monthly Report"
        description="Orders booked per firm per month, with quantity and value."
      />
      <ReportView
        title="Firm Monthly Report"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          month: "Total",
          firm: "",
          orders: totals.orders,
          quantity: totals.quantity,
          value: Math.round(totals.value).toLocaleString("en-IN"),
        }}
      />
    </div>
  );
}
