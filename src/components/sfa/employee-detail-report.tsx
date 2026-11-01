"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, CheckCircle2, Clock, Route } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Employee = {
  _id: string;
  code: string;
  name: string;
  designation: string;
  contactNo: string;
  city: string;
};

type WorkPlan = {
  time: string;
  activity: string;
  location: string;
  status: "completed" | "pending" | "in_progress";
};

type DailyUpdate = {
  time: string;
  activity: string;
  location: string;
  notes: string;
};

type RouteInfo = {
  startLocation: string;
  currentLocation: string;
  plannedStops: number;
  completedStops: number;
  distance: string;
};

export default function EmployeeDetailReport({
  employee,
  filter,
}: {
  employee: Employee;
  filter: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [workPlan, setWorkPlan] = React.useState<WorkPlan[]>([]);
  const [dailyUpdates, setDailyUpdates] = React.useState<DailyUpdate[]>([]);
  const [routeInfo, setRouteInfo] = React.useState<RouteInfo | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sfa/reports/employee-detail/${employee._id}?filter=${filter}`
        );
        const data = await res.json();

        if (res.ok) {
          setWorkPlan(data.workPlan || []);
          setDailyUpdates(data.dailyUpdates || []);
          setRouteInfo(data.routeInfo || null);
        } else {
          toast.error(data.error || "Failed to load employee details");
        }
      } catch {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [employee._id, filter]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft />
        Back to Reports
      </Button>

      {/* Employee Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.contactNo}</div>
            <p className="text-muted-foreground text-xs">{employee.city}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Plan</CardTitle>
            <CheckCircle2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workPlan.filter((w) => w.status === "completed").length}/{workPlan.length}
            </div>
            <p className="text-muted-foreground text-xs">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
            <Clock className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyUpdates.length}</div>
            <p className="text-muted-foreground text-xs">Today's updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route</CardTitle>
            <Route className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routeInfo?.completedStops || 0}/{routeInfo?.plannedStops || 0}
            </div>
            <p className="text-muted-foreground text-xs">Stops completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Route Information */}
      {routeInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Route</CardTitle>
            <CardDescription>Current location and planned route</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <MapPin className="size-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Start Location</p>
                  <p className="text-muted-foreground text-sm">{routeInfo.startLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="size-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Current Location</p>
                  <p className="text-muted-foreground text-sm">{routeInfo.currentLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Route className="size-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Total Distance</p>
                  <p className="text-muted-foreground text-sm">{routeInfo.distance}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Work Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Work Plan</CardTitle>
          <CardDescription>Scheduled activities and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workPlan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                      No work plan for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  workPlan.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.time}</TableCell>
                      <TableCell>{item.activity}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell className="text-right">
                        {item.status === "completed" && (
                          <Badge className="bg-green-500">Completed</Badge>
                        )}
                        {item.status === "in_progress" && (
                          <Badge className="bg-blue-500">In Progress</Badge>
                        )}
                        {item.status === "pending" && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Updates</CardTitle>
          <CardDescription>Real-time activity updates from the field</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyUpdates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                      No updates yet for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  dailyUpdates.map((update, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{update.time}</TableCell>
                      <TableCell>{update.activity}</TableCell>
                      <TableCell>{update.location}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {update.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
