import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { Button } from "@/components/ui/button";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import VisitModel from "@/models/Visit";

const columns = [
  { key: "visitDate", label: "Date" },
  { key: "employeeName", label: "Employee" },
  { key: "subject", label: "Doctor / Firm" },
  { key: "visitType", label: "Type" },
  { key: "city", label: "City" },
  { key: "zone", label: "Zone" },
  { key: "callObjective", label: "Call objective" },
  { key: "pobValue", label: "POB (₹)", numeric: true },
  { key: "status", label: "Status" },
];

type LeanVisit = {
  visitDate?: string;
  employeeName?: string;
  doctor?: string;
  firm?: string;
  visitType?: string;
  city?: string;
  zone?: string;
  callObjective?: string;
  pobValue?: number;
  status?: string;
};

export default async function VisitTrackerPage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const query: Record<string, unknown> = { visitDate: { $gte: from, $lte: to } };
  if (employee) query.employeeName = employee;

  const [visits, employees] = await Promise.all([
    VisitModel.find(query).sort({ visitDate: 1 }).limit(2000).lean<LeanVisit[]>(),
    loadEmployeeNames(),
  ]);

  const rows: ReportRow[] = visits.map((visit) => ({
    visitDate: visit.visitDate ?? "",
    employeeName: visit.employeeName ?? "",
    subject: visit.doctor || visit.firm || "",
    visitType: visit.visitType ?? "",
    city: visit.city ?? "",
    zone: visit.zone ?? "",
    callObjective: visit.callObjective ?? "",
    pobValue: visit.pobValue ?? 0,
    status: visit.status ?? "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/reports" />}>
        <ArrowLeft />
        All reports
      </Button>
      <PageHeader
        title="Visit Tracker"
        description="Every call logged in the period, in date order."
      />
      <ReportView
        title="Visit Tracker"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
      />
    </div>
  );
}
