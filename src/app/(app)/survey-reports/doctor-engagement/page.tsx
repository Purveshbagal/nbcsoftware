import { Stethoscope, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { LedgerStat, UserFilter } from "@/components/payment-ledger";
import { PageHeader } from "@/components/sfa/page-header";
import { SelectFilter } from "@/components/select-filter";
import { connectToDatabase } from "@/lib/mongodb";
import { formatRupees, loadLedger, summarizeByUser } from "@/lib/payment-ledger";
import DoctorModel from "@/models/Doctor";

type DoctorEngagementRow = {
  doctorId: string;
  doctorName: string;
  uinId?: string;
  city?: string;
  speciality?: string;
  approvalStatus?: string;
  totalPayments: number;
  totalAmount: number;
  completedSurveys: number;
  pendingSurveys: number;
  lastPaymentDate?: Date;
};

export default async function DoctorEngagementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, city, status } = await searchParams;
  const selectedUser = typeof user === "string" ? user : undefined;
  const selectedCity = typeof city === "string" ? city : undefined;
  const selectedStatus = typeof status === "string" ? status : undefined;

  await connectToDatabase();
  const ledger = await loadLedger();
  const users = await summarizeByUser(ledger);

  // Get unique doctor IDs from ledger
  const doctorIds = [...new Set(ledger.map((p) => p.doctorId))];

  // Fetch doctor details
  const doctors = await DoctorModel.find({
    _id: { $in: doctorIds },
    source: "survey"
  })
    .select("_id uinId name city speciality approvalStatus")
    .lean();

  const doctorMap = new Map(doctors.map((d: any) => [d._id.toString(), d]));

  // Build engagement data
  const engagementData: DoctorEngagementRow[] = [];

  for (const doctorId of doctorIds) {
    const doctorPayments = ledger.filter((p) => p.doctorId === doctorId);
    const doctor = doctorMap.get(doctorId);

    if (!doctor) continue;

    const completed = doctorPayments.filter((p) => p.stage !== "awaiting-survey").length;
    const pending = doctorPayments.filter((p) => p.stage === "awaiting-survey").length;
    const totalAmount = doctorPayments.reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = doctorPayments
      .filter((p) => p.givenAt)
      .sort((a, b) => (b.givenAt?.getTime() || 0) - (a.givenAt?.getTime() || 0))[0];

    engagementData.push({
      doctorId,
      doctorName: doctor.name || "Unknown",
      uinId: doctor.uinId,
      city: doctor.city,
      speciality: doctor.speciality,
      approvalStatus: doctor.approvalStatus,
      totalPayments: doctorPayments.length,
      totalAmount,
      completedSurveys: completed,
      pendingSurveys: pending,
      lastPaymentDate: lastPayment?.givenAt,
    });
  }

  // Filter data
  const filtered = engagementData.filter((row) => {
    const matchesUser = !selectedUser || ledger.some(
      (p) => p.doctorId === row.doctorId && p.user.username === selectedUser
    );
    const matchesCity = !selectedCity || row.city === selectedCity;
    const matchesStatus = !selectedStatus || row.approvalStatus === selectedStatus;
    return matchesUser && matchesCity && matchesStatus;
  });

  // Calculate stats
  const totalDoctors = filtered.length;
  const totalPayments = filtered.reduce((sum, row) => sum + row.totalPayments, 0);
  const totalAmount = filtered.reduce((sum, row) => sum + row.totalAmount, 0);
  const avgPaymentPerDoctor = totalDoctors > 0 ? totalAmount / totalDoctors : 0;
  const completedSurveys = filtered.reduce((sum, row) => sum + row.completedSurveys, 0);

  // Get unique cities
  const cities = [...new Set(engagementData.map((row) => row.city).filter(Boolean))].sort();

  const selectedName = users.find((u) => u.username === selectedUser)?.name;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <AutoRefresh />
      <PageHeader
        title="Doctor Engagement Report"
        description={`Analyze doctor participation and payment history${selectedName ? ` by ${selectedName}` : " across all users"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <LedgerStat
          label="Total doctors"
          value={totalDoctors.toLocaleString("en-IN")}
          icon={Stethoscope}
          tone="bg-blue-50 text-blue-700"
        />
        <LedgerStat
          label="Total payments"
          value={totalPayments.toLocaleString("en-IN")}
          detail={formatRupees(totalAmount)}
          icon={TrendingUp}
          tone="bg-green-50 text-green-700"
        />
        <LedgerStat
          label="Completed surveys"
          value={completedSurveys.toLocaleString("en-IN")}
          icon={CheckCircle}
          tone="bg-emerald-50 text-emerald-700"
        />
        <LedgerStat
          label="Avg per doctor"
          value={formatRupees(avgPaymentPerDoctor)}
          icon={TrendingUp}
          tone="bg-purple-50 text-purple-700"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <UserFilter basePath="/survey-reports/doctor-engagement" users={users} selected={selectedUser} />

        <SelectFilter
          label="City"
          value={selectedCity || "all"}
          options={[
            { value: "all", label: "All cities" },
            ...Array.from(
              new Set(
                cities
                  .filter((city): city is string => typeof city === "string" && city.trim().length > 0)
                  .map((city) => city.trim())
              )
            ).map((city) => ({ value: city, label: city })),
          ]}
          basePath="/survey-reports/doctor-engagement"
          currentParams={{ user: selectedUser, city: selectedCity, status: selectedStatus }}
          paramName="city"
        />

        <SelectFilter
          label="Approval Status"
          value={selectedStatus || "all"}
          options={[
            { value: "all", label: "All statuses" },
            { value: "approved", label: "Approved" },
            { value: "pending", label: "Pending" },
            { value: "rejected", label: "Rejected" },
          ]}
          basePath="/survey-reports/doctor-engagement"
          currentParams={{ user: selectedUser, city: selectedCity, status: selectedStatus }}
          paramName="status"
        />
      </div>

      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="bg-muted/50">
                <th className="p-3 text-left font-medium">UIN ID</th>
                <th className="p-3 text-left font-medium">Doctor Name</th>
                <th className="p-3 text-left font-medium">City</th>
                <th className="p-3 text-left font-medium">Speciality</th>
                <th className="p-3 text-right font-medium">Payments</th>
                <th className="p-3 text-right font-medium">Total Amount</th>
                <th className="p-3 text-right font-medium">Completed</th>
                <th className="p-3 text-right font-medium">Pending</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No doctor records found.
                  </td>
                </tr>
              ) : (
                filtered
                  .sort((a, b) => b.totalAmount - a.totalAmount)
                  .map((row) => (
                    <tr key={row.doctorId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{row.uinId || "-"}</td>
                      <td className="p-3 font-medium">{row.doctorName}</td>
                      <td className="p-3 text-muted-foreground">{row.city || "-"}</td>
                      <td className="p-3 text-muted-foreground">{row.speciality || "-"}</td>
                      <td className="p-3 text-right">{row.totalPayments}</td>
                      <td className="p-3 text-right font-medium">{formatRupees(row.totalAmount)}</td>
                      <td className="p-3 text-right text-green-600">{row.completedSurveys}</td>
                      <td className="p-3 text-right text-amber-600">{row.pendingSurveys}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.approvalStatus === "approved"
                              ? "bg-green-50 text-green-700"
                              : row.approvalStatus === "rejected"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.approvalStatus === "approved" ? (
                            <CheckCircle className="size-3" />
                          ) : row.approvalStatus === "rejected" ? (
                            <XCircle className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          {row.approvalStatus || "unknown"}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
