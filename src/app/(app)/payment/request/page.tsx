import { AutoRefresh } from "@/components/auto-refresh";
import { NewPaymentDialog } from "@/components/new-payment-dialog";
import { PaymentsTable } from "@/components/payments-table";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureProductCatalog } from "@/lib/product-catalog";
import { serializePayment } from "@/lib/serialize-payment";
import { serializeProduct } from "@/lib/serialize-product";
import { serializeRegistration } from "@/lib/serialize-registration";
import PaymentModel from "@/models/Payment";
import ProductModel from "@/models/Product";
import RegistrationModel from "@/models/Registration";

export default async function PaymentRequestPage() {
  await connectToDatabase();
  await ensureProductCatalog();
  const [payments, approvedRegistrations, products] = await Promise.all([
    PaymentModel.find().sort({ createdAt: -1 }).lean(),
    RegistrationModel.find({ status: "approved" }).sort({ doctorName: 1 }).lean(),
    ProductModel.find().sort({ name: 1 }).lean(),
  ]);

  const doctors = approvedRegistrations.map(serializeRegistration);
  const productList = products.map(serializeProduct);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <AutoRefresh />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Payment Request
          </h2>
          <p className="text-muted-foreground text-sm">
            Create and review payment requests.
          </p>
        </div>
        <NewPaymentDialog doctors={doctors} products={productList} />
      </div>

      <PaymentsTable
        payments={payments.map(serializePayment)}
        emptyMessage='No payment requests yet. Click "New" to submit one.'
        showActions
        doctors={doctors}
        products={productList}
      />
    </div>
  );
}
