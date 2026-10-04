import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MasterTable } from "@/components/sfa/master-table";
import { PageHeader } from "@/components/sfa/page-header";
import { Button } from "@/components/ui/button";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeMasterItem } from "@/lib/serialize-master";
import { MASTER_TYPES, findMasterType } from "@/lib/workspaces";
import MasterItemModel from "@/models/MasterItem";

/** Masters where the generic "Value"/"Group" columns deserve a real name. */
const COLUMN_LABELS: Record<string, { value?: string; parent?: string }> = {
  "business-slab": { value: "Upper limit (₹)" },
  designation: { value: "Hierarchy level", parent: "Reports to" },
  "expense-head": { value: "Monthly cap (₹)" },
  "fixed-allowance": { value: "Amount (₹)" },
  "mode-of-travel": { value: "Rate per km (₹)" },
  "product-sample": { value: "Stock", parent: "Division" },
  "promotional-gift": { value: "Stock", parent: "Division" },
  "radius-setting": { value: "Radius (m)" },
  "scheme-master": { value: "Free qty", parent: "Product" },
  "tax-master": { value: "Rate (%)" },
  "visit-counter": { value: "Visits expected", parent: "Designation" },
  zone: { parent: "State" },
  "doctor-speciality": { parent: "Division" },
  "doctor-category": { value: "Priority" },
  "firm-category": { value: "Priority" },
};

export function generateStaticParams() {
  return MASTER_TYPES.map((master) => ({ type: master.slug }));
}

export default async function MasterPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const master = findMasterType(type);

  if (!master) {
    notFound();
  }

  await connectToDatabase();
  const items = await MasterItemModel.find({ type })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const labels = COLUMN_LABELS[type] ?? {};

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" nativeButton={false} render={<Link href="/sfa/settings/masters" />}>
        <ArrowLeft />
        All masters
      </Button>

      <PageHeader title={master.title} description={master.description} />

      <MasterTable
        type={type}
        items={items.map(serializeMasterItem)}
        valueLabel={labels.value}
        parentLabel={labels.parent}
      />
    </div>
  );
}
