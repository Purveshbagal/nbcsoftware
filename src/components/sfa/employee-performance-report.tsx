"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Employee = {
  _id: string;
  code: string;
  name: string;
  designation: string;
  contactNo: string;
};

type PerformanceData = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  totalWorkDays: number;
  presentDays: number;
  workPlanCompleted: number;
  workPlanTotal: number;
  todayStatus: "working" | "idle" | "offline";
  performanceTrend: "up" | "down" | "stable";
  performanceScore: number; // 0-100
};

export default function EmployeePerformanceReport({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("today");
  const [customFromDate, setCustomFromDate] = React.useState("");
  const [customToDate, setCustomToDate] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [performanceData, setPerformanceData] = React.useState<PerformanceData[]>([]);

  // Fetch performance data
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/sfa/reports/employee-performance?filter=${dateFilter}`;
        if (dateFilter === "custom" && customFromDate && customToDate) {
          url += `&from=${customFromDate}&to=${customToDate}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setPerformanceData(data.performance || []);
        }
      } catch (error) {
        console.error("Failed to fetch performance data", error);
      } finally {
        setLoading(false);
      }
    }

    if (dateFilter !== "custom" || (customFromDate && customToDate)) {
      fetchData();
    }
  }, [dateFilter, customFromDate, customToDate]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return performanceData;
    return performanceData.filter(
      (row) =>
        row.employeeName.toLowerCase().includes(needle) ||
        row.employeeCode.toLowerCase().includes(needle) ||
        row.designation.toLowerCase().includes(needle)
    );
  }, [performanceData, query]);

  function handleEmployeeClick(employeeId: string) {
    router.push(`/sfa/reports/employee/${employeeId}?filter=${dateFilter}`);
  }

  function getPerformanceColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  function renderCandleChart(data: PerformanceData) {
    const score = data.performanceScore;
    const height = Math.max(20, (score / 100) * 60);

    return (
      <div className="flex items-end justify-center h-16">
        <div
          className={`w-8 rounded-t ${
            score >= 80
              ? "bg-green-500"
              : score >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ height: `${height}px` }}
          title={`Performance: ${score}%`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees"
              className="pl-9"
            />
          </div>
          <span className="text-muted-foreground text-sm">
            {filtered.length} of {performanceData.length}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-filter">Date Filter</Label>
            <Select value={dateFilter} onValueChange={(value) => value && setDateFilter(value)}>
              <SelectTrigger id="date-filter" className="w-[160px]">
                <Calendar className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === "custom" && (
            <>
              <div className="flex flex-col gap-1">
                <Label htmlFor="from-date">From</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="to-date">To</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performance Table */}
      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-muted-foreground">Loading performance data...</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-center">Work Days</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Work Plan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Performance</TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground h-32 text-center">
                    No performance data found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={row.employeeId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEmployeeClick(row.employeeId)}
                  >
                    <TableCell className="font-medium">{row.employeeCode}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell className="text-center">{row.totalWorkDays}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        {row.presentDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.workPlanCompleted}/{row.workPlanTotal}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.todayStatus === "working" && (
                        <Badge className="bg-green-500">Working</Badge>
                      )}
                      {row.todayStatus === "idle" && (
                        <Badge className="bg-yellow-500">Idle</Badge>
                      )}
                      {row.todayStatus === "offline" && (
                        <Badge variant="outline">Offline</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderCandleChart(row)}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.performanceTrend === "up" && (
                        <TrendingUp className="text-green-600 mx-auto size-5" />
                      )}
                      {row.performanceTrend === "down" && (
                        <TrendingDown className="text-red-600 mx-auto size-5" />
                      )}
                      {row.performanceTrend === "stable" && (
                        <Minus className="text-muted-foreground mx-auto size-5" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
