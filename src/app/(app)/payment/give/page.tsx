import { AutoRefresh } from "@/components/auto-refresh";
import { GivePaymentDialog } from "@/components/give-payment-dialog";
import { GivePaymentTable } from "@/components/give-payment-table";
import { connectToDatabase } from "@/lib/mongodb";
import { serializePayment } from "@/lib/serialize-payment";
import PaymentModel from "@/models/Payment";

export default async function GivePaymentPage() {
  await connectToDatabase();

  const payments = await PaymentModel.find({
    status: "approved",
    "surveyUpload.data": { $exists: true },
  })
    .sort({ paidAt: -1, createdAt: -1 })
    .lean();

  const serialized = payments.map(serializePayment);
  const eligiblePayments = serialized.filter((p) => !p.paidAt);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <AutoRefresh />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Give Payment
          </h2>
          <p className="text-muted-foreground text-sm">
            Disburse payments for completed surveys and generate receipts.
          </p>
        </div>
        <GivePaymentDialog eligiblePayments={eligiblePayments} />
      </div>

      <GivePaymentTable payments={serialized} />
    </div>
  );
}
