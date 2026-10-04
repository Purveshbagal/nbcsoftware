import { redirect } from "next/navigation";

/** HR's leave report is the same report served under Reports. */
export default function HrLeaveReportPage() {
  redirect("/sfa/reports/leave-report");
}
