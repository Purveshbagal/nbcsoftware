import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import { istDayStart, loadAllowanceSettings, planLabel, readPlan, saveWorkPlan } from "@/lib/work-plan";
import AttendanceModel from "@/models/Attendance";
import ExpenseModel from "@/models/Expense";
import ExpenseRouteModel from "@/models/ExpenseRoute";
import MasterItemModel from "@/models/MasterItem";

/** What the plan dialog needs: all talukas, configured routes, rates, and today's plan. */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const [talukas, routes, settings, plan] = await Promise.all([
    MasterItemModel.find({ type: "taluka", isActive: true })
      .select("name parent")
      .sort({ name: 1 })
      .lean<{ name: string; parent?: string }[]>(),
    ExpenseRouteModel.find({ isActive: true })
      .select("fromTaluka fromDistrict toTaluka toDistrict distanceKm")
      .sort({ fromTaluka: 1, toTaluka: 1 })
      .lean<
        {
          fromTaluka: string;
          fromDistrict?: string;
          toTaluka: string;
          toDistrict?: string;
          distanceKm: number;
        }[]
      >(),
    loadAllowanceSettings(),
    ExpenseModel.findOne({
      employeeId: auth.employee.employeeId,
      expenseDate: istDayStart(istDateKey()),
    }).lean(),
  ]);

  return NextResponse.json({
    talukas: talukas.map((t) => ({ name: t.name, district: t.parent ?? "" })),
    routes: routes.map((r) => ({
      from: r.fromTaluka,
      fromDistrict: r.fromDistrict ?? "",
      to: r.toTaluka,
      toDistrict: r.toDistrict ?? "",
      distanceKm: r.distanceKm,
    })),
    settings,
    plan,
  });
}

/** Change today's plan (route, mode, fare) after punching in — not once you have arrived. */
export async function PATCH(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const date = istDateKey();
  const attendance = await AttendanceModel.findOne({ employeeId: employee.employeeId, date });
  if (!attendance?.punchIn?.at) {
    return NextResponse.json({ error: "Punch in first" }, { status: 409 });
  }
  if (attendance.punchOut?.at) {
    return NextResponse.json({ error: "Your day is already complete" }, { status: 409 });
  }

  const current = await ExpenseModel.findOne({
    employeeId: employee.employeeId,
    expenseDate: istDayStart(date),
  })
    .select("arrivalStatus")
    .lean<{ arrivalStatus?: string }>();
  if (current?.arrivalStatus === "arrived") {
    return NextResponse.json(
      { error: "You have already arrived, so the plan can no longer be changed" },
      { status: 409 }
    );
  }

  const parsed = readPlan(await readJsonBody(request));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { plan } = parsed;

  const workPlan = await saveWorkPlan({ employee, dateKey: date, plan, attendanceId: attendance._id });
  await AttendanceModel.updateOne(
    { _id: attendance._id },
    {
      workLocation: planLabel(plan),
      route: plan.workPlan === "outstation" ? planLabel(plan) : "",
      travelMode: plan.travelMode ?? "",
    }
  );
  return NextResponse.json({ workPlan });
}
