import { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";
import EmployeePerformanceReport from "@/components/sfa/employee-performance-report";

export const metadata: Metadata = {
  title: "Reports",
  description: "Employee performance and work reports",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await connectToDatabase();

  // Get all active employees
  const employees = await EmployeeModel.find({ isActive: true })
    .select("code name designation contactNo")
    .sort({ code: 1 })
    .lean();

  const employeeList = employees.map((emp) => ({
    _id: emp._id.toString(),
    code: emp.code,
    name: emp.name,
    designation: emp.designation || "",
    contactNo: emp.contactNo || "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Employee performance tracking with work plans and daily updates
        </p>
      </div>

      <EmployeePerformanceReport employees={employeeList} />
    </div>
  );
}
