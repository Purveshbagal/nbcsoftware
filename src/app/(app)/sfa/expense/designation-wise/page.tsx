import Link from "next/link";

import { PageHeader } from "@/components/sfa/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { connectToDatabase } from "@/lib/mongodb";
import FareChartModel from "@/models/FareChart";

export default async function DesignationWiseExpensePage() {
  await connectToDatabase();

  const grouped = await FareChartModel.aggregate<{
    _id: { designation: string; mode: string };
    routes: number;
    minFare: number;
    maxFare: number;
    avgFare: number;
    avgDistance: number;
  }>([
    {
      $group: {
        _id: {
          designation: { $ifNull: ["$designation", "(unspecified)"] },
          mode: { $ifNull: ["$mode", "(unspecified)"] },
        },
        routes: { $sum: 1 },
        minFare: { $min: { $ifNull: ["$fare", 0] } },
        maxFare: { $max: { $ifNull: ["$fare", 0] } },
        avgFare: { $avg: { $ifNull: ["$fare", 0] } },
        avgDistance: { $avg: { $ifNull: ["$distanceKm", 0] } },
      },
    },
    { $sort: { "_id.designation": 1, "_id.mode": 1 } },
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Designation Wise Expense"
        description="The travel allowance each designation can claim, derived from the approved fare chart."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/sfa/expense/fare-chart" />}>
            Edit fare chart
          </Button>
        }
      />

      {grouped.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <p className="text-muted-foreground max-w-md py-16 text-center text-sm">
            Nothing to show yet. Add routes to the Standard Fare Chart and the
            allowance per designation appears here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designation</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Routes</TableHead>
                <TableHead className="text-right">Avg distance (Km)</TableHead>
                <TableHead className="text-right">Lowest fare</TableHead>
                <TableHead className="text-right">Average fare</TableHead>
                <TableHead className="text-right">Highest fare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map((group) => (
                <TableRow key={`${group._id.designation}-${group._id.mode}`}>
                  <TableCell className="font-medium">{group._id.designation}</TableCell>
                  <TableCell>{group._id.mode}</TableCell>
                  <TableCell className="text-right tabular-nums">{group.routes}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.avgDistance.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{group.minFare.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{Math.round(group.avgFare).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{group.maxFare.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
