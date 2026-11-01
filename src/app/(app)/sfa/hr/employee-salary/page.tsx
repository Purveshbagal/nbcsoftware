import { PageHeader } from "@/components/sfa/page-header";
import { EmployeeSalaryTable } from "@/components/sfa/employee-salary-table";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";
import EmployeeSalaryModel from "@/models/EmployeeSalary";

export default async function EmployeeSalaryPage() {
  await connectToDatabase();

  // Get all active employees
  const employees = await EmployeeModel.find({ isActive: { $ne: false } })
    .select("code name designation contactNo")
    .sort({ name: 1 })
    .lean();

  // Get salary data
  const salaryData = await EmployeeSalaryModel.find({}).lean();
  const salaryMap = new Map(
    salaryData.map((s) => [s.employeeId.toString(), s])
  );

  // Combine data
  const rows = employees.map((emp) => {
    const salary = salaryMap.get(emp._id.toString());
    return {
      _id: emp._id.toString(),
      employeeCode: emp.code || "",
      employeeName: emp.name,
      designation: emp.designation || "",
      contactNo: emp.contactNo || "",
      salaryAmount: salary?.salaryAmount || 0,
      effectiveFrom: salary?.effectiveFrom || "",
      updatedBy: salary?.updatedBy?.name || "",
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Employee Salary"
        description="Set and manage monthly salary for employees. Click on an employee to edit their salary amount."
      />
      <EmployeeSalaryTable rows={rows} />
    </div>
  );
}
