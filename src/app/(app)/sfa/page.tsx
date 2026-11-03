import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  CircleCheckBig,
  FileStack,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Receipt,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { istDateKey } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import AdvanceRequestModel from "@/models/AdvanceRequest";
import AttendanceModel from "@/models/Attendance";
import DoctorModel from "@/models/Doctor";
import EmployeeModel from "@/models/Employee";
import EmployeeUpdateModel from "@/models/EmployeeUpdate";
import ExpenseModel from "@/models/Expense";
import ExpenseRequestModel from "@/models/ExpenseRequest";
import LeaveRequestModel from "@/models/LeaveRequest";
import ReminderModel from "@/models/Reminder";
import SampleRequestModel from "@/models/SampleRequest";
import VisitModel from "@/models/Visit";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatTime(value?: Date | string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatHours(minutes?: number) {
  if (!minutes || minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function inr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

type Tone = {
  tile: string;
  text: string;
  bar: string;
  ring: string;
};

const TONES: Record<string, Tone> = {
  teal: { tile: "bg-teal-50", text: "text-teal-700", bar: "bg-teal-500", ring: "border-teal-200" },
  violet: { tile: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-500", ring: "border-violet-200" },
  rose: { tile: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500", ring: "border-rose-200" },
  amber: { tile: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", ring: "border-amber-200" },
  sky: { tile: "bg-sky-50", text: "text-sky-700", bar: "bg-sky-500", ring: "border-sky-200" },
  emerald: { tile: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500", ring: "border-emerald-200" },
  indigo: { tile: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-500", ring: "border-indigo-200" },
};

export default async function FieldForceDashboard() {
  await connectToDatabase();

  const todayKey = istDateKey();
  const monthStart = `${todayKey.slice(0, 7)}-01`;
  const monthStartDate = new Date(`${monthStart}T00:00:00+05:30`);

  // Last 7 India-time days, oldest first.
  const weekKeys = Array.from({ length: 7 }, (_, i) =>
    istDateKey(new Date(Date.now() - (6 - i) * DAY_MS))
  );

  const [
    totalEmployees,
    totalDoctors,
    pendingDoctorApprovals,
    punchedInToday,
    visitsToday,
    closedToday,
    closedThisMonth,
    monthExpense,
    pendingExpenseRequests,
    pendingLeaves,
    pendingAdvances,
    pendingSamples,
    openReminders,
    weekVisits,
    monthVisitStatus,
    topPerformers,
    todayAttendance,
    recentVisits,
    recentUpdates,
  ] = await Promise.all([
    EmployeeModel.countDocuments({ isActive: true }),
    DoctorModel.countDocuments({ isActive: true }),
    DoctorModel.countDocuments({ approvalStatus: "pending" }),
    AttendanceModel.countDocuments({ date: todayKey, "punchIn.at": { $exists: true } }),
    VisitModel.countDocuments({ visitDate: todayKey }),
    VisitModel.countDocuments({ status: "closed", visitDate: todayKey }),
    VisitModel.countDocuments({ status: "closed", visitDate: { $gte: monthStart } }),
    ExpenseModel.aggregate<{ _id: string; total: number }>([
      { $match: { expenseDate: { $gte: monthStartDate } } },
      { $group: { _id: "$paymentStatus", total: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
    ]),
    ExpenseRequestModel.countDocuments({ status: "pending" }),
    LeaveRequestModel.countDocuments({ status: "pending" }),
    AdvanceRequestModel.countDocuments({ status: "pending" }),
    SampleRequestModel.countDocuments({ status: "pending" }),
    ReminderModel.countDocuments({ status: "open", date: { $lte: todayKey } }),
    VisitModel.aggregate<{ _id: { date: string; status: string }; count: number }>([
      { $match: { visitDate: { $gte: weekKeys[0], $lte: todayKey } } },
      { $group: { _id: { date: "$visitDate", status: "$status" }, count: { $sum: 1 } } },
    ]),
    VisitModel.aggregate<{ _id: string; count: number }>([
      { $match: { visitDate: { $gte: monthStart } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    VisitModel.aggregate<{ _id: string; count: number }>([
      { $match: { status: "closed", visitDate: { $gte: monthStart }, employeeName: { $nin: [null, ""] } } },
      { $group: { _id: "$employeeName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    AttendanceModel.find({ date: todayKey })
      .sort({ "punchIn.at": -1 })
      .limit(8)
      .lean<
        {
          _id: { toString(): string };
          employeeName?: string;
          workLocation?: string;
          punchIn?: { at?: Date };
          punchOut?: { at?: Date };
          workingMinutes?: number;
          distanceKm?: number;
        }[]
      >(),
    VisitModel.find({})
      .sort({ createdAt: -1 })
      .limit(6)
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
    EmployeeUpdateModel.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<
        {
          _id: { toString(): string };
          employeeName?: string;
          updateText?: string;
          createdAt?: Date;
        }[]
      >(),
  ]);

  const expensePaid = monthExpense.find((r) => r._id === "paid")?.total ?? 0;
  const expensePending = monthExpense
    .filter((r) => r._id !== "paid")
    .reduce((sum, r) => sum + r.total, 0);
  const expenseTotal = expensePaid + expensePending;

  const attendancePercent =
    totalEmployees > 0 ? Math.round((punchedInToday / totalEmployees) * 100) : 0;

  // Per-day visit counts for the 7-day chart.
  const weekChart = weekKeys.map((key) => {
    const rows = weekVisits.filter((r) => r._id.date === key);
    const closed = rows.find((r) => r._id.status === "closed")?.count ?? 0;
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const label = new Date(`${key}T12:00:00+05:30`).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    });
    return { key, label, closed, other: total - closed, total };
  });
  const weekMax = Math.max(1, ...weekChart.map((d) => d.total));

  const statusMeta: { status: string; label: string; bar: string }[] = [
    { status: "closed", label: "Closed", bar: "bg-emerald-500" },
    { status: "open", label: "Open", bar: "bg-sky-500" },
    { status: "planned", label: "Planned", bar: "bg-amber-400" },
    { status: "skipped", label: "Skipped", bar: "bg-rose-400" },
  ];
  const monthVisitTotal = monthVisitStatus.reduce((sum, r) => sum + r.count, 0);
  const topMax = Math.max(1, ...topPerformers.map((p) => p.count));

  const kpis: {
    label: string;
    value: string;
    caption: string;
    href: string;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    {
      label: "Punched in today",
      value: `${punchedInToday}/${totalEmployees}`,
      caption: `${attendancePercent}% of field team on duty`,
      href: "/sfa/tracking",
      icon: Navigation,
      tone: TONES.teal,
    },
    {
      label: "Calls today",
      value: `${closedToday}/${visitsToday}`,
      caption: "Closed out of logged today",
      href: "/sfa/visits/doctors",
      icon: MapPin,
      tone: TONES.emerald,
    },
    {
      label: "Closed this month",
      value: closedThisMonth.toLocaleString("en-IN"),
      caption: "Completed calls since the 1st",
      href: "/sfa/reports",
      icon: CheckCircle2,
      tone: TONES.indigo,
    },
    {
      label: "Doctors",
      value: totalDoctors.toLocaleString("en-IN"),
      caption:
        pendingDoctorApprovals > 0
          ? `${pendingDoctorApprovals} waiting for approval`
          : "Active in the universe",
      href: "/sfa/people/doctors",
      icon: Stethoscope,
      tone: TONES.rose,
    },
    {
      label: "Expense this month",
      value: inr(expenseTotal),
      caption: `${inr(expensePaid)} paid · ${inr(expensePending)} pending`,
      href: "/sfa/expense/all",
      icon: IndianRupee,
      tone: TONES.sky,
    },
    {
      label: "Field employees",
      value: totalEmployees.toLocaleString("en-IN"),
      caption: "Active on the Racer app",
      href: "/sfa/people/employees",
      icon: Users,
      tone: TONES.violet,
    },
  ];

  const attention: {
    label: string;
    count: number;
    detail: string;
    href: string;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    { label: "Doctor approvals", count: pendingDoctorApprovals, detail: "Doctors added from the app", href: "/sfa/doctor-approvals", icon: CircleCheckBig, tone: TONES.rose },
    { label: "Expense requests", count: pendingExpenseRequests, detail: "Bills waiting for review", href: "/sfa/expense/requests", icon: Receipt, tone: TONES.sky },
    { label: "Leave requests", count: pendingLeaves, detail: "Leaves to approve", href: "/sfa/hr/leave-requests", icon: CalendarClock, tone: TONES.amber },
    { label: "Advance requests", count: pendingAdvances, detail: "Advance payments to review", href: "/sfa/hr/advance-request", icon: Wallet, tone: TONES.violet },
    { label: "Sample requests", count: pendingSamples, detail: "Samples and gifts to issue", href: "/sfa/sample-request", icon: ClipboardList, tone: TONES.teal },
    { label: "Reminders due", count: openReminders, detail: "Open for today or earlier", href: "/sfa/reminders", icon: Clock, tone: TONES.indigo },
  ];
  const attentionTotal = attention.reduce((sum, item) => sum + item.count, 0);

  const quickLinks: { href: string; title: string; icon: LucideIcon; tone: Tone }[] = [
    { href: "/sfa/visits/doctors", title: "Doctors Visit", icon: MapPin, tone: TONES.emerald },
    { href: "/sfa/tracking", title: "Live Tracking", icon: Navigation, tone: TONES.teal },
    { href: "/sfa/overview/updates", title: "Updates", icon: FileStack, tone: TONES.indigo },
    { href: "/sfa/chat", title: "Team Chat", icon: MessageCircle, tone: TONES.violet },
    { href: "/sfa/expense/all", title: "Expenses", icon: IndianRupee, tone: TONES.sky },
    { href: "/sfa/products", title: "Products", icon: Package, tone: TONES.amber },
    { href: "/sfa/hr/attendance", title: "Attendance", icon: Clock, tone: TONES.rose },
    { href: "/sfa/reports", title: "Reports", icon: BarChart3, tone: TONES.teal },
  ];

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2a45] via-[#0a4a5c] to-[#087f82] p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[.18em] text-teal-200">
              RACER NBC · FIELD FORCE
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting()}, Administrator
            </h2>
            <p className="mt-2 text-sm text-teal-50/80">{todayLabel}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                {punchedInToday} of {totalEmployees} employees on duty
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                {closedToday} calls closed today
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  attentionTotal > 0 ? "bg-amber-400 text-amber-950" : "bg-emerald-400 text-emerald-950"
                }`}
              >
                {attentionTotal > 0 ? `${attentionTotal} items need attention` : "Everything is up to date"}
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-teal-100">Team attendance today</span>
              <span className="text-2xl font-semibold tabular-nums">{attendancePercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200"
                style={{ width: `${attendancePercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="focus-visible:outline-primary group bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm outline-offset-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2"
          >
            <span className={`absolute inset-y-0 left-0 w-1.5 ${kpi.tone.bar}`} />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="min-w-0">
                <p className="text-muted-foreground text-sm font-medium">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-muted-foreground mt-2 truncate text-xs">{kpi.caption}</p>
              </div>
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${kpi.tone.tile} ${kpi.tone.text}`}
              >
                <kpi.icon className="size-5" />
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Needs attention */}
      <section className="bg-card rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Needs your attention</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Approvals and requests the field team is waiting on.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {attention.map((item) => {
            const active = item.count > 0;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`focus-visible:outline-primary flex items-center gap-4 rounded-xl border p-4 outline-offset-2 transition-colors hover:bg-muted/60 focus-visible:outline-2 ${
                  active ? `${item.tone.tile} ${item.tone.ring}` : "bg-background"
                }`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                    active ? `bg-white ${item.tone.text}` : "bg-muted text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {active ? item.detail : "All clear"}
                  </p>
                </div>
                <span
                  className={`text-2xl font-semibold tabular-nums ${
                    active ? item.tone.text : "text-muted-foreground"
                  }`}
                >
                  {item.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Calls in the last 7 days</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Closed calls against everything logged each day.
              </p>
            </div>
            <div className="text-muted-foreground flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-500" /> Closed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-amber-300" /> Other
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-52 items-end justify-between gap-3">
            {weekChart.map((day) => (
              <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold tabular-nums">{day.total || ""}</span>
                <div className="bg-muted flex w-full max-w-12 flex-1 flex-col justify-end overflow-hidden rounded-t-lg">
                  <div
                    className="w-full bg-amber-300"
                    style={{ height: `${(day.other / weekMax) * 100}%` }}
                    title={`${day.other} other`}
                  />
                  <div
                    className="w-full bg-emerald-500"
                    style={{ height: `${(day.closed / weekMax) * 100}%` }}
                    title={`${day.closed} closed`}
                  />
                </div>
                <span
                  className={`text-xs ${
                    day.key === todayKey ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold">This month&apos;s calls</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {monthVisitTotal.toLocaleString("en-IN")} calls logged so far.
          </p>
          {monthVisitTotal === 0 ? (
            <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm">
              No calls logged this month.
            </p>
          ) : (
            <>
              <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted">
                {statusMeta.map((meta) => {
                  const count = monthVisitStatus.find((r) => r._id === meta.status)?.count ?? 0;
                  return (
                    <div
                      key={meta.status}
                      className={meta.bar}
                      style={{ width: `${(count / monthVisitTotal) * 100}%` }}
                    />
                  );
                })}
              </div>
              <ul className="mt-5 space-y-3">
                {statusMeta.map((meta) => {
                  const count = monthVisitStatus.find((r) => r._id === meta.status)?.count ?? 0;
                  return (
                    <li key={meta.status} className="flex items-center gap-3 text-sm">
                      <span className={`size-2.5 rounded-sm ${meta.bar}`} />
                      <span className="flex-1">{meta.label}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                      <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                        {Math.round((count / monthVisitTotal) * 100)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* Team today + leaderboard */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Team today</h3>
              <p className="text-muted-foreground mt-1 text-sm">Who has punched in and where.</p>
            </div>
            <Link href="/sfa/tracking" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              Live map <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {todayAttendance.length === 0 ? (
            <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm">
              Nobody has punched in yet today.
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {todayAttendance.map((row) => {
                const onDuty = !row.punchOut?.at;
                const name = row.employeeName || "Employee";
                return (
                  <li key={row._id.toString()} className="flex items-center gap-4 py-3">
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {row.workLocation || "Location not set"} · In {formatTime(row.punchIn?.at)}
                        {row.punchOut?.at ? ` · Out ${formatTime(row.punchOut.at)}` : ""}
                      </p>
                    </div>
                    <div className="hidden text-right text-xs sm:block">
                      <p className="font-medium tabular-nums">{formatHours(row.workingMinutes)}</p>
                      <p className="text-muted-foreground tabular-nums">
                        {row.distanceKm ? `${row.distanceKm.toFixed(1)} km` : "-"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        onDuty ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {onDuty ? "On duty" : "Done"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Top performers</h3>
          <p className="text-muted-foreground mt-1 text-sm">Most calls closed this month.</p>
          {topPerformers.length === 0 ? (
            <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm">
              No closed calls this month.
            </p>
          ) : (
            <ol className="mt-5 space-y-4">
              {topPerformers.map((person, index) => (
                <li key={person._id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          index === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="truncate font-medium">{person._id}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{person.count}</span>
                  </div>
                  <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      style={{ width: `${(person.count / topMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Latest visits + updates */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Latest visits</h3>
              <p className="text-muted-foreground mt-1 text-sm">Most recent calls logged by the team.</p>
            </div>
            <Link href="/sfa/visits/doctors" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              View all <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {recentVisits.length === 0 ? (
            <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm">
              No visits recorded yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {recentVisits.map((visit) => {
                const status = visit.status ?? "";
                const badge =
                  status === "closed"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "skipped"
                      ? "bg-rose-100 text-rose-700"
                      : status === "open"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-amber-100 text-amber-700";
                return (
                  <li key={visit._id.toString()} className="flex items-center gap-3 py-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        visit.visitType === "firm" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {visit.visitType === "firm" ? <Package className="size-4" /> : <Stethoscope className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{visit.doctor || visit.firm || "-"}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {visit.employeeName || "-"} · {visit.visitDate || "-"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${badge}`}>
                      {status || "-"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Recent updates</h3>
              <p className="text-muted-foreground mt-1 text-sm">Work notes posted from the app.</p>
            </div>
            <Link href="/sfa/overview/updates" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
              View all <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {recentUpdates.length === 0 ? (
            <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-6 text-center text-sm">
              No updates posted yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {recentUpdates.map((update) => (
                <li key={update._id.toString()} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                    {(update.employeeName || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{update.employeeName}</p>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {update.createdAt
                          ? new Date(update.createdAt).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">{update.updateText}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Quick access */}
      <section className="bg-card rounded-2xl border p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Quick access</h3>
        <p className="text-muted-foreground mt-1 text-sm">Where the work usually starts.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-visible:outline-primary hover:bg-muted/60 flex items-center gap-3 rounded-xl border p-4 outline-offset-2 transition-colors focus-visible:outline-2"
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.tone.tile} ${item.tone.text}`}>
                <item.icon className="size-5" />
              </div>
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
