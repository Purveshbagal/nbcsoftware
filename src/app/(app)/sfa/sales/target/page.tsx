import Link from "next/link";

import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import {
  loadDoctorNames,
  loadEmployeeNames,
  loadFirmNames,
  loadMasterOptions,
} from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import TargetModel from "@/models/Target";

const TABS = [
  { slug: "employee", title: "Employee Wise", subjectLabel: "" },
  { slug: "hq", title: "HQ Wise", subjectLabel: "HQ" },
  { slug: "product", title: "Product Wise", subjectLabel: "Product" },
  { slug: "doctor", title: "Doctor Wise", subjectLabel: "Doctor" },
  { slug: "firm", title: "Firm Wise", subjectLabel: "Firm" },
  { slug: "product-group", title: "Product Group Wise", subjectLabel: "Product Group" },
  { slug: "yearly", title: "Yearly Sales Target", subjectLabel: "" },
] as const;

type TabSlug = (typeof TABS)[number]["slug"];

/** Which measures each tab actually captures, mirroring the source screens. */
const MEASURES: Record<TabSlug, { key: string; label: string }[]> = {
  employee: [
    { key: "pobValue", label: "POB Value" },
    { key: "secondarySales", label: "Secondary Sales" },
    { key: "doctorVisits", label: "Doctor Visit" },
    { key: "chemistVisits", label: "Chemist Visit" },
    { key: "newDoctorAddition", label: "New Doctor Addition" },
    { key: "newChemistAddition", label: "New Chemist Addition" },
    { key: "primarySalesValue", label: "Primary Sales Value" },
    { key: "primarySalesQty", label: "Primary Sales Qty" },
  ],
  hq: [
    { key: "pobValue", label: "POB Value" },
    { key: "secondarySales", label: "Secondary Value" },
    { key: "doctorVisits", label: "Doctor Visit" },
    { key: "chemistVisits", label: "Chemist Visit" },
    { key: "primarySalesValue", label: "Primary Sales Value" },
  ],
  product: [
    { key: "primarySalesQty", label: "Product Quantity" },
    { key: "primarySalesValue", label: "Product Value" },
  ],
  doctor: [{ key: "pobValue", label: "POB Value" }],
  firm: [
    { key: "pobValue", label: "POB Value" },
    { key: "secondarySales", label: "Secondary Value" },
  ],
  "product-group": [{ key: "pobValue", label: "POB Value" }],
  yearly: [
    { key: "pobValue", label: "POB Value" },
    { key: "primarySalesValue", label: "Primary Sales Value" },
    { key: "secondarySales", label: "Secondary Sales" },
  ],
};

export default async function TargetPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = (TABS.find((item) => item.slug === tab) ?? TABS[0]);

  await connectToDatabase();

  const [docs, masters, employees, doctors, firms] = await Promise.all([
    TargetModel.find({ targetType: activeTab.slug }).sort({ year: -1, month: -1 }).lean(),
    loadMasterOptions(["zone", "division"]),
    loadEmployeeNames(),
    activeTab.slug === "doctor" ? loadDoctorNames() : Promise.resolve([]),
    activeTab.slug === "firm" ? loadFirmNames() : Promise.resolve([]),
  ]);

  const measures = MEASURES[activeTab.slug];

  const subjectOptions =
    activeTab.slug === "doctor"
      ? doctors
      : activeTab.slug === "firm"
        ? firms
        : activeTab.slug === "hq"
          ? masters.zone
          : [];

  const columns: Column[] = [
    ...(activeTab.subjectLabel
      ? [{ key: "subject", label: activeTab.subjectLabel } as Column]
      : []),
    { key: "employeeName", label: "Employee Name" },
    { key: "frequency", label: "Frequency" },
    { key: "month", label: "Month" },
    { key: "quarter", label: "Quarter", secondary: true },
    { key: "year", label: "Year" },
    ...measures.map((measure) => ({
      key: measure.key,
      label: measure.label,
      type: "number" as const,
    })),
  ];

  const fields: Field[] = [
    ...(activeTab.subjectLabel
      ? [
          {
            key: "subject",
            label: activeTab.subjectLabel,
            type: subjectOptions.length ? ("select" as const) : ("text" as const),
            options: subjectOptions,
            section: "Target",
          },
        ]
      : []),
    {
      key: "employeeName",
      label: "Employee",
      type: "select",
      options: employees,
      section: "Target",
    },
    {
      key: "frequency",
      label: "Frequency",
      type: "select",
      options: ["monthly", "quarterly", "yearly"],
      section: "Target",
    },
    { key: "month", label: "Month", section: "Target", placeholder: "e.g. Oct" },
    { key: "quarter", label: "Quarter", section: "Target", placeholder: "e.g. Q3" },
    { key: "year", label: "Year", section: "Target", placeholder: "e.g. 2026" },
    ...measures.map((measure) => ({
      key: measure.key,
      label: measure.label,
      type: "number" as const,
      section: "Measures",
    })),
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Target"
        description="What each employee, HQ, product, doctor or firm is expected to deliver."
      />

      <nav className="flex flex-wrap gap-1 border-b pb-2" aria-label="Target type">
        {TABS.map((item) => (
          <Link
            key={item.slug}
            href={`/sfa/sales/target?tab=${item.slug}`}
            aria-current={item.slug === activeTab.slug ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              item.slug === activeTab.slug
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <EntityTable
        key={activeTab.slug}
        endpoint="/api/sfa/targets"
        entityName="Target"
        labelKey={activeTab.subjectLabel ? "subject" : "employeeName"}
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        // Keeps a row added here inside the tab it was added from.
        defaults={{ targetType: activeTab.slug }}
        filters={[
          { key: "employeeName", label: "Employee", options: employees },
          { key: "frequency", label: "Frequency", options: ["monthly", "quarterly", "yearly"] },
        ]}
      />
    </div>
  );
}
