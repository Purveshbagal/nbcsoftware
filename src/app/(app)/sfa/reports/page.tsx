import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";

const REPORT_GROUPS = [
  {
    label: "Work reports",
    reports: [
      {
        slug: "call-report",
        title: "Call Report",
        description:
          "Closed, skipped and open calls per employee over a period, with the business booked.",
      },
      {
        slug: "visit-tracker",
        title: "Visit Tracker",
        description: "Every call in the period, listed in date order for one employee or all.",
      },
    ],
  },
  {
    label: "Productivity & business reports",
    reports: [
      {
        slug: "daily-call-report",
        title: "All India Daily Call Report",
        description: "Calls per day across the country for a chosen month.",
      },
      {
        slug: "employee-performance",
        title: "Employee Daily Performance Report",
        description: "Calls, leave and claims per employee for a selected period.",
      },
    ],
  },
  {
    label: "Expense & leave reports",
    reports: [
      {
        slug: "expense-report",
        title: "Expense Report",
        description: "Claims by employee and head, split by approval state.",
      },
      {
        slug: "leave-report",
        title: "Leave Report",
        description: "Leave taken per employee, by type and status.",
      },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Every report runs on live data from this workspace and exports to CSV."
      />

      {REPORT_GROUPS.map((group) => (
        <section key={group.label} className="flex flex-col gap-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-[.14em] uppercase">
            {group.label}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.reports.map((report) => (
              <Link
                key={report.slug}
                href={`/sfa/reports/${report.slug}`}
                className="group bg-card hover:border-primary/40 flex flex-col gap-2 rounded-xl border p-4 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{report.title}</span>
                  <ArrowUpRight className="text-muted-foreground group-hover:text-primary ml-auto size-4" />
                </div>
                <p className="text-muted-foreground text-xs">{report.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
