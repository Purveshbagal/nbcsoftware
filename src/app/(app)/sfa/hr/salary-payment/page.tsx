import { PageHeader } from "@/components/sfa/page-header";
import { SalaryPaymentTable } from "@/components/sfa/salary-payment-table";
import { connectToDatabase } from "@/lib/mongodb";
import SalaryPaymentModel from "@/models/SalaryPayment";
import EmployeeModel from "@/models/Employee";

export default async function SalaryPaymentPage() {
  await connectToDatabase();

  const [payments, employees] = await Promise.all([
    SalaryPaymentModel.find({}).sort({ paymentDate: -1 }).limit(500).lean(),
    EmployeeModel.find({ isActive: { $ne: false } })
      .select("_id code name designation")
      .sort({ name: 1 })
      .lean(),
  ]);

  const paymentRows = payments.map((p) => ({
    _id: p._id.toString(),
    employeeCode: p.employeeCode,
    employeeName: p.employeeName,
    month: p.month,
    salaryAmount: p.salaryAmount,
    presentDays: p.presentDays,
    absentDays: p.absentDays,
    paidLeaveDays: p.paidLeaveDays,
    absentDeduction: p.absentDeduction,
    advanceDeduction: p.advanceDeduction,
    netPayable: p.netPayable,
    paidAmount: p.paidAmount,
    paymentDate: p.paymentDate,
    paymentMode: p.paymentMode,
    remarks: p.remarks,
    paidBy: p.paidBy?.name || "",
  }));

  const employeeOptions = employees.map((e) => ({
    _id: e._id.toString(),
    code: e.code,
    name: e.name,
    designation: e.designation,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Salary Payment"
        description="Record salary payments to employees. System automatically deducts advances and calculates net payable based on attendance."
      />
      <SalaryPaymentTable rows={paymentRows} employees={employeeOptions} />
    </div>
  );
}
