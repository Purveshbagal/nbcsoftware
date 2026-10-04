import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function AccountingPage() {
  return (
    <ModulePlaceholder
      title="Accounting & Inventory"
      summary="Invoicing against orders, and the stock behind them."
      willInclude={[
        "Invoices raised against orders, with tax and scheme handling",
        "Receipts and outstanding per firm",
        "Inventory: batch, expiry and warehouse stock",
        "Credit and debit notes for returns and breakages",
      ]}
      related={[
        { href: "/sfa/sales/orders", label: "Orders" },
        { href: "/sfa/products", label: "Products" },
        { href: "/sfa/sales/rate-master", label: "Rate Master" },
      ]}
    />
  );
}
