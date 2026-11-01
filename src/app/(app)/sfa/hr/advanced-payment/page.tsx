import { PageHeader } from "@/components/sfa/page-header";
import { AdvancedPaymentTable } from "@/components/sfa/advanced-payment-table";
import { connectToDatabase } from "@/lib/mongodb";
import AdvancedPaymentModel from "@/models/AdvancedPayment";
import EmployeeModel from "@/models/Employee";

export default async function AdvancedPaymentPage() {
  await connectToDatabase();

  const [advances, employees] = await Promise.all([
    AdvancedPaymentModel.find({}).sort({ givenDate: -1 }).lean(),
    EmployeeModel.find({ isActive: { $ne: false } })
      .select("_id code name")
      .sort({ name: 1 })
      .lean(),
  ]);

  const rows = advances.map((a) => ({
    _id: a._id.toString(),
    employeeCode: a.employeeCode,
    employeeName: a.employeeName,
    advanceAmount: a.advanceAmount,
    paymentType: a.paymentType,
    givenDate: a.givenDate,
    totalDeducted: a.totalDeducted,
    remainingAmount: a.remainingAmount,
    status: a.status,
    installments: a.installments || [],
  }));

  const employeeOptions = employees.map((e) => ({
    _id: e._id.toString(),
    code: e.code,
    name: e.name,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Advanced Payment"
        description="Manage employee advances with one-time or installment deductions. Advances are automatically deducted during salary payment."
      />
      <AdvancedPaymentTable rows={rows} employees={employeeOptions} />
    </div>
  );
}
