import { OrdersTable, type OrderRow } from "@/components/sfa/orders-table";
import { PageHeader } from "@/components/sfa/page-header";
import {
  loadDoctorNames,
  loadEmployeeNames,
  loadFirmNames,
  loadMasterOptions,
} from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import SfaProductModel from "@/models/SfaProduct";

export default async function OrdersPage() {
  await connectToDatabase();

  const [docs, masters, employees, firms, doctors, products] = await Promise.all([
    OrderModel.find({}).sort({ orderDate: -1 }).lean(),
    loadMasterOptions(["zone", "division"]),
    loadEmployeeNames(),
    loadFirmNames(),
    loadDoctorNames(),
    SfaProductModel.find({ isActive: true })
      .select("name")
      .sort({ name: 1 })
      .lean<{ name: string }[]>(),
  ]);

  const orders = JSON.parse(JSON.stringify(docs)) as OrderRow[];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Orders"
        description="Primary orders booked against firms, with their product lines and value."
      />
      <OrdersTable
        orders={orders}
        options={{
          firms,
          doctors,
          employees,
          products: products.map((product) => product.name),
          zones: masters.zone,
          divisions: masters.division,
        }}
      />
    </div>
  );
}
