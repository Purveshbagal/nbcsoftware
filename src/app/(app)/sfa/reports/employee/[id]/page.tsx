import { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";
import EmployeeDetailReport from "@/components/sfa/employee-detail-report";

export const metadata: Metadata = {
  title: "Employee Details",
  description: "Employee work plan and daily activity report",
};

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  await connectToDatabase();

  const { id } = await params;
  const { filter } = await searchParams;
  const employee = await EmployeeModel.findById(id)
    .select("code name designation contactNo city")
    .lean();

  if (!employee) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Employee not found</div>
      </div>
    );
  }

  const employeeData = {
    _id: employee._id.toString(),
    code: employee.code,
    name: employee.name,
    designation: employee.designation || "",
    contactNo: employee.contactNo || "",
    city: employee.city || "",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
        <p className="text-muted-foreground">
          {employee.designation} • {employee.code}
        </p>
      </div>

      <EmployeeDetailReport
        employee={employeeData}
        filter={filter || "today"}
      />
    </div>
  );
}
