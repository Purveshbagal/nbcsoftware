import { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";
import AttendanceTable from "@/components/sfa/attendance-table";

export const metadata: Metadata = {
  title: "Attendance",
  description: "View employee attendance records",
};

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  await connectToDatabase();

  // Get all active employees
  const employees = await EmployeeModel.find({ status: "active" })
    .select("code name designation contactNo")
    .sort({ code: 1 })
    .lean();

  const employeeList = employees.map((emp) => ({
    _id: emp._id.toString(),
    employeeCode: emp.code,
    employeeName: emp.name,
    designation: emp.designation || "",
    contactNo: emp.contactNo || "",
  }));

  // Default to current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          View employee attendance summary with present, absent, and paid leave days
        </p>
      </div>

      <AttendanceTable employees={employeeList} defaultMonth={defaultMonth} />
    </div>
  );
}
