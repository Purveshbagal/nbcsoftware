import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function SecondarySalesPage() {
  return (
    <ModulePlaceholder
      title="Secondary Sales (Stock Tally)"
      summary="Opening stock, purchases, sales and closing stock reported by each firm, month by month."
      willInclude={[
        "A monthly stock tally per firm and product: opening, inward, sales, closing",
        "Variance against the primary orders already recorded",
        "Submission and approval deadlines, driven by Stock Month Maintenance",
        "Export of the tally for a chosen month and division",
      ]}
      related={[
        { href: "/sfa/sales/orders", label: "Orders" },
        { href: "/sfa/sales/firm-monthly", label: "Firm Monthly" },
        { href: "/sfa/sales/stock-maintenance", label: "Stock Month Maintenance" },
      ]}
    />
  );
}
