import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";

const REPORT_GROUPS = [
  {
    label: "Survey Performance Reports",
    reports: [
      {
        slug: "survey-completion",
        title: "Survey Completion Report",
        description:
          "Track survey form completion status by doctor, field user, and date range with downloadable details.",
      },
      {
        slug: "payment-workflow",
        title: "Payment Approval Workflow Report",
        description: "Monitor payment stages from survey upload to disbursement, filtered by user and status.",
      },
    ],
  },
  {
    label: "Doctor Engagement Reports",
    reports: [
      {
        slug: "doctor-engagement",
        title: "Doctor Engagement Report",
        description: "Analyze doctor participation, approval rates, and payment history across products and regions.",
      },
      {
        slug: "product-survey-analysis",
        title: "Product Survey Analysis",
        description: "Product-wise survey responses, completion rates, and payment distributions.",
      },
    ],
  },
  {
    label: "Financial Reports",
    reports: [
      {
        slug: "payment-summary",
        title: "Payment Summary Report",
        description: "Total payments by doctor, product, user, and date with pending vs. completed breakdowns.",
      },
    ],
  },
];

export default function SurveyReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Survey Reports"
        description="Comprehensive reports for survey completion, payment workflow, and doctor engagement with advanced filters."
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
                href={`/survey-reports/${report.slug}`}
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
