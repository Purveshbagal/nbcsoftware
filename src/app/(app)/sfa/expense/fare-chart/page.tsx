import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import FareChartModel from "@/models/FareChart";

const columns: Column[] = [
  { key: "routeName", label: "Route Name" },
  { key: "citiesInRoute", label: "Cities In Route" },
  { key: "zone", label: "Zone" },
  { key: "division", label: "Division", secondary: true },
  { key: "routeFor", label: "Route For", secondary: true },
  { key: "designation", label: "Designation" },
  { key: "mode", label: "Mode" },
  { key: "distanceKm", label: "Distance (Km)", type: "number" },
  { key: "fare", label: "Fare", type: "currency" },
  { key: "createdAt", label: "Created", type: "date", secondary: true },
  { key: "isApproved", label: "Approved", type: "bool" },
];

export default async function FareChartPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    FareChartModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["zone", "division", "designation", "mode-of-travel"]),
  ]);

  const fields: Field[] = [
    { key: "routeName", label: "Route Name", required: true, section: "Route" },
    { key: "citiesInRoute", label: "Cities In Route", wide: true, section: "Route" },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Route" },
    { key: "division", label: "Division", type: "select", options: masters.division, section: "Route" },
    {
      key: "routeFor",
      label: "Route For",
      type: "select",
      options: ["Headquarter", "Ex-Station", "Outstation"],
      section: "Route",
    },
    {
      key: "designation",
      label: "Designation",
      type: "select",
      options: masters.designation,
      section: "Route",
    },

    {
      key: "mode",
      label: "Mode Of Travel",
      type: "select",
      options: masters["mode-of-travel"],
      section: "Fare",
    },
    { key: "distanceKm", label: "Distance (Km)", type: "number", section: "Fare" },
    { key: "fare", label: "Fare (₹)", type: "number", section: "Fare" },
    { key: "isApproved", label: "Approved", type: "checkbox", section: "Fare" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Standard Fare Chart"
        description="Approved routes, distances and fares by designation. Claims are checked against this chart."
      />
      <EntityTable
        endpoint="/api/sfa/fare-chart"
        entityName="Route"
        labelKey="routeName"
        rows={toPlainRows(docs)}
        columns={columns}
        fields={fields}
        filters={[
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "division", label: "Division", options: masters.division },
          { key: "designation", label: "Designation", options: masters.designation },
        ]}
      />
    </div>
  );
}
