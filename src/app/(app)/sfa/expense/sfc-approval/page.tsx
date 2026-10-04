import Link from "next/link";

import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { Button } from "@/components/ui/button";
import { loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import FareChartModel from "@/models/FareChart";

const columns: Column[] = [
  { key: "routeName", label: "Route Name" },
  { key: "citiesInRoute", label: "Cities" },
  { key: "designation", label: "Designation" },
  { key: "mode", label: "Mode" },
  { key: "distanceKm", label: "Distance", type: "number" },
  { key: "fare", label: "Fare", type: "currency" },
  { key: "zone", label: "Zone" },
  { key: "division", label: "Division", secondary: true },
  { key: "isApproved", label: "Approved", type: "bool" },
];

export default async function SfcApprovalPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    FareChartModel.find({ isApproved: false }).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["zone", "division", "designation"]),
  ]);

  const fields: Field[] = [
    { key: "routeName", label: "Route Name", required: true },
    { key: "citiesInRoute", label: "Cities In Route", wide: true },
    { key: "designation", label: "Designation", type: "select", options: masters.designation },
    { key: "zone", label: "Zone", type: "select", options: masters.zone },
    { key: "distanceKm", label: "Distance (Km)", type: "number" },
    { key: "fare", label: "Fare (₹)", type: "number" },
    { key: "isApproved", label: "Approve this route", type: "checkbox", wide: true },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="SFC Approval"
        description="Routes waiting on approval. Tick 'Approve this route' on a row to release it into the standard fare chart."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/sfa/expense/fare-chart" />}>
            Full fare chart
          </Button>
        }
      />
      <EntityTable
        endpoint="/api/sfa/fare-chart"
        entityName="Route"
        labelKey="routeName"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        emptyMessage="Nothing is waiting for approval. New routes added in the fare chart show up here until they are approved."
        filters={[
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "designation", label: "Designation", options: masters.designation },
        ]}
      />
    </div>
  );
}
