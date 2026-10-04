import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  IndianRupee,
  MapPin,
  Stethoscope,
  Users,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { istDateKey } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import AttendanceModel from "@/models/Attendance";
import DoctorModel from "@/models/Doctor";
import EmployeeModel from "@/models/Employee";
import ExpenseModel from "@/models/Expense";
import FirmModel from "@/models/Firm";
import VisitModel from "@/models/Visit";

function startOfMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function FieldForceDashboard() {
  await connectToDatabase();

  const today = new Date();
  const monthStart = startOfMonthKey(today);
  const todayKey = today.toISOString().slice(0, 10);

  const [
    employees,
    doctors,
    firms,
    approvedThisMonth,
    closedThisMonth,
    closedToday,
    recentVisits,
    onDutyToday,
  ] = await Promise.all([
    EmployeeModel.countDocuments({ isActive: true }),
    DoctorModel.countDocuments({ isActive: true }),
    FirmModel.countDocuments({ isActive: true }),
    ExpenseModel.aggregate<{ total: number }>([
      { $match: { status: "approved", expenseDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ["$fare", 0] }, { $ifNull: ["$otherAmount", 0] }] } } } },
    ]),
    VisitModel.countDocuments({ status: "closed", visitDate: { $gte: monthStart } }),
    VisitModel.countDocuments({ status: "closed", visitDate: todayKey }),
    VisitModel.find({})
      .sort({ visitDate: -1 })
      .limit(8)
      .lean<
        {
          _id: { toString(): string };
          visitType?: string;
          doctor?: string;
          firm?: string;
          employeeName?: string;
          visitDate?: string;
          status?: string;
        }[]
      >(),
    AttendanceModel.countDocuments({ date: istDateKey(), "punchIn.at": { $exists: true } }),
  ]);

  const expenseTotal = approvedThisMonth[0]?.total ?? 0;

  const stats = [
    {
      label: "Field Employees",
      caption: "Total active employees",
      value: employees.toLocaleString("en-IN"),
      href: "/sfa/people/employees",
      icon: Users,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Doctors",
      caption: "Total active doctors",
      value: doctors.toLocaleString("en-IN"),
      href: "/sfa/people/doctors",
      icon: Stethoscope,
      tone: "bg-rose-50 text-rose-700",
    },
    {
      label: "Firms",
      caption: "Total active firms",
      value: firms.toLocaleString("en-IN"),
      href: "/sfa/sales/firms",
      icon: Building2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Expenses",
      caption: "Approved this month",
      value: `₹${expenseTotal.toLocaleString("en-IN")}`,
      href: "/sfa/expense",
      icon: IndianRupee,
      tone: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <p className="text-primary mb-2 text-xs font-semibold tracking-[.16em]">
          FIELD FORCE OVERVIEW
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Your team, at a glance</h2>
        <p className="text-muted-foreground text-sm">
          Coverage, calls and claims across every zone and division.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="focus-visible:outline-primary rounded-xl outline-offset-4 transition-transform hover:-translate-y-1 focus-visible:outline-2"
          >
            <Card className="h-full py-6">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="mt-3 text-3xl font-semibold tabular-nums">
                    {stat.value}
                  </CardTitle>
                  <p className="text-muted-foreground mt-2 text-xs">{stat.caption}</p>
                </div>
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                  <stat.icon className="size-5" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/sfa/tracking"
          className="focus-visible:outline-primary rounded-xl outline-offset-4 transition-transform hover:-translate-y-1 focus-visible:outline-2"
        >
          <Card className="h-full py-6">
            <CardHeader>
              <CardDescription>Punched in today</CardDescription>
              <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
                {onDutyToday.toLocaleString("en-IN")}
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-xs">Open live tracking</p>
            </CardHeader>
          </Card>
        </Link>
        <Card className="py-6">
          <CardHeader>
            <CardDescription>Closed calls this month</CardDescription>
            <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
              {closedThisMonth.toLocaleString("en-IN")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="py-6">
          <CardHeader>
            <CardDescription>Closed calls today</CardDescription>
            <CardTitle className="mt-2 text-3xl font-semibold tabular-nums">
              {closedToday.toLocaleString("en-IN")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="text-lg font-semibold">Latest visits</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            The most recent calls logged by the team.
          </p>
          {recentVisits.length === 0 ? (
            <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm">
              No visits recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVisits.map((visit) => (
                    <TableRow key={visit._id.toString()}>
                      <TableCell className="font-medium">
                        {visit.doctor || visit.firm || "-"}
                      </TableCell>
                      <TableCell>{visit.visitType ?? "-"}</TableCell>
                      <TableCell>{visit.employeeName || "-"}</TableCell>
                      <TableCell>{visit.visitDate || "-"}</TableCell>
                      <TableCell>{visit.status ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border p-6">
          <h3 className="text-lg font-semibold">Quick access</h3>
          <p className="text-muted-foreground mt-1 text-sm">Where the work usually starts.</p>
          <div className="mt-5 divide-y">
            {[
              { href: "/sfa/visits/doctors", title: "Doctors Visit", detail: "Log and review doctor calls", icon: MapPin },
              { href: "/sfa/people/doctors", title: "Doctors", detail: "Maintain the doctor universe", icon: Stethoscope },
              { href: "/sfa/expense", title: "Expenses", detail: "Approve travel and other claims", icon: IndianRupee },
              { href: "/sfa/reports", title: "Reports", detail: "Calls, productivity and expense reports", icon: BarChart3 },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-visible:outline-primary hover:bg-muted flex items-center gap-4 rounded-lg py-4 outline-offset-2 focus-visible:outline-2"
              >
                <item.icon className="text-primary size-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{item.detail}</p>
                </div>
                <ArrowUpRight className="text-muted-foreground size-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
