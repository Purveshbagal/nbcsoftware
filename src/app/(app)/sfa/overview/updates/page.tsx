import { connectToDatabase } from "@/lib/mongodb";
import EmployeeUpdateModel from "@/models/EmployeeUpdate";
import { PageHeader } from "@/components/sfa/page-header";
import { UpdatesTimeline } from "@/components/sfa/updates-timeline";

export const dynamic = "force-dynamic";

export default async function UpdatesOverviewPage() {
  await connectToDatabase();

  // Get recent updates from all employees (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const updates = await EmployeeUpdateModel.find({
    createdAt: { $gte: sevenDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const plainUpdates = updates.map((u) => ({
    id: u._id.toString(),
    employeeId: u.employeeId?.toString() || "",
    employeeName: u.employeeName,
    employeeUsername: u.employeeUsername || "",
    updateText: u.updateText,
    updateDate: u.updateDate,
    location: u.location,
    createdAt: u.createdAt?.toISOString() || "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Employee Updates"
        description="Real-time work progress updates from your field team. Click on an employee to see their complete update history."
      />
      <UpdatesTimeline updates={plainUpdates} />
    </div>
  );
}
