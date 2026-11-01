import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft } from "lucide-react";

import { EmployeeAppCredentials } from "@/components/sfa/employee-app-credentials";
import { PageHeader } from "@/components/sfa/page-header";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";

export const dynamic = "force-dynamic";

function InfoField({ label, value }: { label: string; value: unknown }) {
  const text = value === null || value === undefined || value === "" ? "—" : String(value);

  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{text}</dd>
    </div>
  );
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const employee = await EmployeeModel.findById(id)
    .select(
      "+appPasswordHash code name email contactNo designation workType assignTo city state district taluka village address division zone reportingTo dateOfBirth dateOfJoin dateOfResignation inactiveDate inactiveReason isActive appUsername appAccessEnabled lastSeenAt deviceInfo"
    )
    .lean();

  if (!employee) notFound();

  const credentials = {
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
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link
        href="/sfa/people/employees"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to employees
      </Link>

      <PageHeader
        title={employee.name}
        description={[employee.code, employee.designation].filter(Boolean).join(" · ")}
      />

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Employee information</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Employee ID" value={employee.code} />
          <InfoField label="Full name" value={employee.name} />
          <InfoField label="Designation" value={employee.designation} />
          <InfoField label="Mobile number" value={employee.contactNo} />
          <InfoField label="Email" value={employee.email} />
          <InfoField label="Employment status" value={employee.isActive === false ? "Inactive" : "Active"} />
          <InfoField label="Division" value={employee.division} />
          <InfoField label="Zone" value={employee.zone} />
          <InfoField label="Work type" value={employee.workType} />
          <InfoField label="Assigned to" value={employee.assignTo} />
          <InfoField label="Reports to" value={employee.reportingTo} />
          <InfoField label="Date of birth" value={employee.dateOfBirth} />
          <InfoField label="Date of joining" value={employee.dateOfJoin} />
          <InfoField label="Date of resignation" value={employee.dateOfResignation} />
          <InfoField label="Inactive date" value={employee.inactiveDate} />
          <InfoField label="Inactive reason" value={employee.inactiveReason} />
          <InfoField label="City" value={employee.city} />
          <InfoField label="Taluka" value={employee.taluka} />
          <InfoField label="District" value={employee.district} />
          <InfoField label="State" value={employee.state} />
          <InfoField label="Village" value={employee.village} />
          <InfoField label="Address" value={employee.address} />
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">NBC Labs app login</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Passwords are securely hashed and cannot be viewed. Reset the password to issue a new one; it will be shown once.
            </p>
          </div>
          <EmployeeAppCredentials row={credentials} />
        </div>
        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          <InfoField label="App user ID" value={employee.appUsername} />
          <InfoField
            label="Password"
            value={employee.appPasswordHash ? "Set — hidden for security" : "Not set"}
          />
          <InfoField
            label="App access"
            value={employee.appAccessEnabled ? "Enabled" : "Disabled"}
          />
          <InfoField
            label="Last sign-in"
            value={
              employee.lastSeenAt
                ? new Date(employee.lastSeenAt).toLocaleString("en-IN")
                : "Never signed in"
            }
          />
          <InfoField label="Device" value={employee.deviceInfo} />
        </dl>
      </section>
    </div>
  );
}
