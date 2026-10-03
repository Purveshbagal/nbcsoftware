import { AutoRefresh } from "@/components/auto-refresh";
import { PaymentsTable } from "@/components/payments-table";
import { connectToDatabase } from "@/lib/mongodb";
import { serializePayment } from "@/lib/serialize-payment";
import PaymentModel from "@/models/Payment";

export default async function PaymentApprovalHistoryPage() {
  await connectToDatabase();
  const payments = await PaymentModel.find({ status: { $ne: "pending" } })
    .sort({ reviewedAt: -1 })
    .lean();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <AutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Payment Approval History
        </h2>
        <p className="text-muted-foreground text-sm">
          Past payment decisions — approved and rejected requests.
        </p>
      </div>

      <PaymentsTable
        payments={payments.map(serializePayment)}
        emptyMessage="No payment decisions yet."
      />
    </div>
  );
}
