import { PageHeader } from "@/components/sfa/page-header";
import { LeaveRequestTable } from "@/components/sfa/leave-request-table";
import { connectToDatabase } from "@/lib/mongodb";
import LeaveRequestModel from "@/models/LeaveRequest";

export default async function LeaveRequestPage() {
  await connectToDatabase();

  const requests = await LeaveRequestModel.find({})
    .sort({ createdAt: -1 })
    .lean();

  const rows = requests.map((r) => ({
    _id: r._id.toString(),
    employeeCode: r.employeeCode,
    employeeName: r.employeeName,
    leaveType: r.leaveType,
    fromDate: r.fromDate,
    toDate: r.toDate,
    totalDays: r.totalDays,
    reason: r.reason,
    status: r.status,
    reviewedBy: r.reviewedBy?.name || "",
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : "",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Leave Requests"
        description="Review leave applications from employees. Approved paid leaves update attendance and balance automatically."
      />
      <LeaveRequestTable rows={rows} />
    </div>
  );
}
