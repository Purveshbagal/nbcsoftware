import { PageHeader } from "@/components/sfa/page-header";
import { ReportView, type ReportRow } from "@/components/sfa/report-view";
import { loadEmployeeNames } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveRange, type ReportParams } from "@/lib/report-range";
import AttendanceModel from "@/models/Attendance";

const columns = [
  { key: "date", label: "Date" },
  { key: "employeeName", label: "Employee" },
  { key: "zone", label: "Zone" },
  { key: "punchIn", label: "Punch in" },
  { key: "punchOut", label: "Punch out" },
  { key: "hours", label: "Working hours", numeric: true },
  { key: "distanceKm", label: "Distance (km)", numeric: true },
  { key: "workAgenda", label: "Agenda" },
  { key: "status", label: "Status" },
  { key: "inLocation", label: "Punch-in location" },
];

type Punch = { at?: Date; lat?: number; lng?: number };

type LeanAttendance = {
  date: string;
  employeeName?: string;
  zone?: string;
  workAgenda?: string;
  punchIn?: Punch;
  punchOut?: Punch;
  workingMinutes?: number;
  distanceKm?: number;
  status?: string;
};

function clock(at?: Date) {
  if (!at) return "";
  return new Date(at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<ReportParams>;
}) {
  const { from, to, employee } = resolveRange(await searchParams);

  await connectToDatabase();

  const query: Record<string, unknown> = { date: { $gte: from, $lte: to } };
  if (employee) query.employeeName = employee;

  const [records, employees] = await Promise.all([
    AttendanceModel.find(query).sort({ date: -1, employeeName: 1 }).limit(5000).lean<LeanAttendance[]>(),
    loadEmployeeNames(),
  ]);

  const totalMinutes = records.reduce((sum, record) => sum + (record.workingMinutes ?? 0), 0);
  const totalKm = records.reduce((sum, record) => sum + (record.distanceKm ?? 0), 0);

  const rows: ReportRow[] = records.map((record) => {
    const open = record.punchIn?.at && !record.punchOut?.at;
    const minutes = record.workingMinutes ?? 0;
    return {
      date: record.date,
      employeeName: record.employeeName ?? "",
      zone: record.zone ?? "",
      punchIn: clock(record.punchIn?.at),
      punchOut: open ? "On duty" : clock(record.punchOut?.at),
      hours: open ? "" : (minutes / 60).toFixed(2),
      distanceKm: open ? "" : (record.distanceKm ?? 0).toFixed(1),
      workAgenda: record.workAgenda ?? "",
      status: record.status ?? "",
      inLocation:
        record.punchIn?.lat !== undefined && record.punchIn?.lng !== undefined
          ? `${record.punchIn.lat.toFixed(5)}, ${record.punchIn.lng.toFixed(5)}`
          : "",
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Attendance"
        description="Daily punch-in and punch-out from the NBC Labs mobile app, with hours worked and ground covered. Open Live Tracking to see a day's route."
      />
      <ReportView
        title="Attendance"
        columns={columns}
        rows={rows}
        from={from}
        to={to}
        employee={employee}
        employees={employees}
        totalsRow={{
          date: "Total",
          hours: (totalMinutes / 60).toFixed(2),
          distanceKm: totalKm.toFixed(1),
        }}
      />
    </div>
  );
}
