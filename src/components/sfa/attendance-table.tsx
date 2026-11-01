"use client";

import * as React from "react";
import { Calendar, Eye, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  employeeCode: string;
  employeeName: string;
  designation: string;
  contactNo: string;
};

type AttendanceSummary = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  totalDays: number;
};

type AttendanceDetail = {
  date: string;
  status: "present" | "absent" | "paid_leave";
  punchIn?: string;
  punchOut?: string;
  workingMinutes: number;
  reason?: string;
  leaveType?: string;
};

export default function AttendanceTable({
  employees,
  defaultMonth,
}: {
  employees: Employee[];
  defaultMonth: string;
}) {
  const [month, setMonth] = React.useState(defaultMonth);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [attendanceData, setAttendanceData] = React.useState<AttendanceSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = React.useState<AttendanceSummary | null>(null);
  const [employeeDetails, setEmployeeDetails] = React.useState<AttendanceDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

  // Generate month options (January to December of current year)
  const monthOptions = React.useMemo(() => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let i = 0; i < 12; i++) {
      const value = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      const label = monthNames[i];
      options.push({ value, label });
    }
    return options;
  }, []);

  // Fetch attendance summary
  React.useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sfa/hr/attendance?month=${month}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to fetch attendance");
          return;
        }

        setAttendanceData(data.attendance || []);
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [month]);

  // Fetch employee details
  async function handleViewDetails(employee: AttendanceSummary) {
    setSelectedEmployee(employee);
    setLoadingDetails(true);

    try {
      const res = await fetch(
        `/api/sfa/hr/attendance/${employee.employeeId}?month=${month}`
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to fetch details");
        return;
      }

      setEmployeeDetails(data.details || []);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingDetails(false);
    }
  }

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return attendanceData;
    return attendanceData.filter(
      (row) =>
        row.employeeName.toLowerCase().includes(needle) ||
        row.employeeCode.toLowerCase().includes(needle) ||
        row.designation.toLowerCase().includes(needle)
    );
  }, [attendanceData, query]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            {filtered.length} of {attendanceData.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-4" />
          <Label htmlFor="month-select" className="sr-only">
            Select Month
          </Label>
          <Select value={month} onValueChange={(value) => value && setMonth(value)}>
            <SelectTrigger id="month-select" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-muted-foreground">Loading attendance...</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-center">Total Days</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Paid Leave</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground h-32 text-center">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TableCell className="font-medium">{row.employeeCode}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.designation || "-"}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {row.totalDays}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        {row.presentDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        {row.absentDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-blue-500 text-blue-600">
                        {row.paidLeaveDays}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(row)}
                      >
                        <Eye />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Employee Details Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Attendance Details - {selectedEmployee?.employeeName}
            </DialogTitle>
            <DialogDescription>
              Day-wise attendance for{" "}
              {monthOptions.find((m) => m.value === month)?.label}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="text-muted-foreground">Loading details...</div>
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeDetails.map((detail, idx) => {
                    const date = new Date(detail.date);
                    const dayName = date.toLocaleDateString("en-IN", { weekday: "short" });
                    const hours = (detail.workingMinutes / 60).toFixed(1);

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {date.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{dayName}</TableCell>
                        <TableCell>
                          {detail.status === "present" && (
                            <Badge className="bg-green-500">Present</Badge>
                          )}
                          {detail.status === "absent" && (
                            <Badge className="bg-red-500">Absent</Badge>
                          )}
                          {detail.status === "paid_leave" && (
                            <Badge className="bg-blue-500">Paid Leave</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {detail.punchIn
                            ? new Date(detail.punchIn).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {detail.punchOut
                            ? new Date(detail.punchOut).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {detail.workingMinutes > 0 ? `${hours}h` : "-"}
                        </TableCell>
                        <TableCell>
                          {detail.reason ? (
                            <span className="text-sm">{detail.reason}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
