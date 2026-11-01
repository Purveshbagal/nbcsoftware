import { connectToDatabase } from "@/lib/mongodb";
import EmployeeUpdateModel from "@/models/EmployeeUpdate";
import { PageHeader } from "@/components/sfa/page-header";
import { EmployeeUpdateHistory } from "@/components/sfa/employee-update-history";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ name?: string; date?: string }>;
};

export default async function EmployeeUpdatesPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { employeeId } = params;
  const { name, date } = searchParams;

  if (!Types.ObjectId.isValid(employeeId)) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader title="Invalid Employee" description="Employee ID is not valid" />
      </div>
    );
  }

  await connectToDatabase();

  // Build query
  const query: any = { employeeId: new Types.ObjectId(employeeId) };

  // Filter by specific date if provided
  if (date) {
    query.updateDate = date;
  }

  const updates = await EmployeeUpdateModel.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const plainUpdates = updates.map((u) => ({
    id: u._id.toString(),
    updateText: u.updateText,
    updateDate: u.updateDate,
    location: u.location,
    createdAt: u.createdAt?.toISOString() || "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`Updates - ${name || "Employee"}`}
        description="View all updates posted by this employee. Filter by specific date or view all updates."
      />
      <EmployeeUpdateHistory
        employeeId={employeeId}
        employeeName={name || "Employee"}
        updates={plainUpdates}
        selectedDate={date}
      />
    </div>
  );
}
