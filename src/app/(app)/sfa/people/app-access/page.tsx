import { AppAccessTable, type AppAccessRow } from "@/components/sfa/app-access-table";
import { PageHeader } from "@/components/sfa/page-header";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";

type LeanEmployee = {
  _id: { toString(): string };
  code?: string;
  name: string;
  designation?: string;
  zone?: string;
  contactNo?: string;
  appUsername?: string;
  appPasswordHash?: string;
  appAccessEnabled?: boolean;
  lastSeenAt?: Date;
  deviceInfo?: string;
};

export default async function AppAccessPage() {
  await connectToDatabase();

  // The hash is read only to know whether a password exists; it never leaves the server.
  const employees = await EmployeeModel.find({ isActive: { $ne: false } })
    .select("+appPasswordHash code name designation zone contactNo appUsername appAccessEnabled lastSeenAt deviceInfo")
    .sort({ name: 1 })
    .lean<LeanEmployee[]>();

  const rows: AppAccessRow[] = employees.map((employee) => ({
    id: employee._id.toString(),
    code: employee.code ?? "",
    name: employee.name,
    designation: employee.designation ?? "",
    zone: employee.zone ?? "",
    contactNo: employee.contactNo ?? "",
    appUsername: employee.appUsername ?? "",
    appAccessEnabled: Boolean(employee.appAccessEnabled),
    hasPassword: Boolean(employee.appPasswordHash),
    lastSeenAt: employee.lastSeenAt ? new Date(employee.lastSeenAt).toISOString() : null,
    deviceInfo: employee.deviceInfo ?? "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Mobile App Access"
        description="Login IDs for the NBC Labs employee app. These are separate from NBC Pedia accounts. Disabling access signs the employee out at their next request."
      />
      <AppAccessTable rows={rows} />
    </div>
  );
}
