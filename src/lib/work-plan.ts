import ExpenseAllowanceModel from "@/models/ExpenseAllowance";
import ExpenseModel from "@/models/Expense";
import ExpenseRouteModel from "@/models/ExpenseRoute";
import MasterItemModel from "@/models/MasterItem";

export const WORK_PLANS = ["headquarter", "in-city", "outstation"] as const;
export const TRAVEL_MODES = ["bike", "car", "public-transport"] as const;
export type WorkPlan = (typeof WORK_PLANS)[number];
export type TravelMode = (typeof TRAVEL_MODES)[number];

/** Midnight (India time) of an `istDateKey` day, as stored in `Expense.expenseDate`. */
export function istDayStart(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+05:30`);
}

export async function loadAllowanceSettings() {
  const settings = await ExpenseAllowanceModel.findOne().lean<{
    bikePerKm?: number;
    carPerKm?: number;
    publicTransportPerKm?: number;
    headquarterAllowance?: number;
    inCityAllowance?: number;
    outstationAllowance?: number;
  }>();
  return {
    bikePerKm: settings?.bikePerKm ?? 0,
    carPerKm: settings?.carPerKm ?? 0,
    publicTransportPerKm: settings?.publicTransportPerKm ?? 0,
    headquarterAllowance: settings?.headquarterAllowance ?? 0,
    inCityAllowance: settings?.inCityAllowance ?? 0,
    outstationAllowance: settings?.outstationAllowance ?? 0,
  };
}

type Settings = Awaited<ReturnType<typeof loadAllowanceSettings>>;

/** Travel fare plus the fixed daily allowance for the chosen work plan. */
export function computeAmounts(
  input: { workPlan: WorkPlan; travelMode?: TravelMode; distanceKm?: number; manualFare?: number },
  settings: Settings
) {
  const distance = input.distanceKm ?? 0;
  let travelAllowance = 0;
  if (input.workPlan === "outstation" && input.travelMode) {
    if (input.travelMode === "public-transport" && input.manualFare && input.manualFare > 0) {
      travelAllowance = input.manualFare;
    } else {
      const rate =
        input.travelMode === "bike"
          ? settings.bikePerKm
          : input.travelMode === "car"
            ? settings.carPerKm
            : settings.publicTransportPerKm;
      travelAllowance = Math.round(distance * rate * 100) / 100;
    }
  }
  const workPlanAllowance =
    input.workPlan === "headquarter"
      ? settings.headquarterAllowance
      : input.workPlan === "in-city"
        ? settings.inCityAllowance
        : settings.outstationAllowance;
  return { travelAllowance, workPlanAllowance };
}

/** A configured route between two talukas, in either direction. */
export async function findRoute(fromTaluka: string, toTaluka: string) {
  return ExpenseRouteModel.findOne({
    isActive: true,
    $or: [
      { fromTaluka, toTaluka },
      { fromTaluka: toTaluka, toTaluka: fromTaluka },
    ],
  }).lean<{ _id: unknown; distanceKm: number } | null>();
}

export type Plan = {
  workPlan: WorkPlan;
  fromTaluka?: string;
  toTaluka?: string;
  travelMode?: TravelMode;
  manualFare?: number;
};

/** Validate the plan fields sent by the app. */
export function readPlan(body: Record<string, unknown> | null): { plan: Plan } | { error: string } {
  const workPlan = String(body?.workPlan ?? "") as WorkPlan;
  if (!WORK_PLANS.includes(workPlan)) return { error: "Choose where you are working today" };
  if (workPlan !== "outstation") return { plan: { workPlan } };

  const fromTaluka = String(body?.fromTaluka ?? "").trim();
  const toTaluka = String(body?.toTaluka ?? "").trim();
  const travelMode = String(body?.travelMode ?? "") as TravelMode;
  if (!fromTaluka || !toTaluka) return { error: "Select the From and To city for your outstation route" };
  if (fromTaluka === toTaluka) return { error: "From and To city cannot be the same" };
  if (!TRAVEL_MODES.includes(travelMode)) return { error: "Select a travel mode" };
  const fare = Number(body?.manualFare);
  return {
    plan: {
      workPlan,
      fromTaluka,
      toTaluka,
      travelMode,
      manualFare: travelMode === "public-transport" && Number.isFinite(fare) && fare > 0 ? fare : undefined,
    },
  };
}

/** Short label stored on the attendance row. */
export function planLabel(plan: Plan) {
  if (plan.workPlan === "outstation") return `${plan.fromTaluka} → ${plan.toTaluka}`;
  return plan.workPlan === "in-city" ? "In city" : "Head quarter";
}

/** Create or replace the day's work-plan expense (one per employee per day). */
export async function saveWorkPlan(args: {
  employee: { employeeId: string; name: string; username: string; zone: string; division: string; designation: string };
  dateKey: string;
  plan: Plan;
  attendanceId?: unknown;
  punchedInAt?: Date;
}) {
  const { employee, dateKey, plan } = args;
  const settings = await loadAllowanceSettings();

  let route: { _id: unknown; distanceKm: number } | null = null;
  let fromDistrict = "";
  let toDistrict = "";
  if (plan.workPlan === "outstation" && plan.fromTaluka && plan.toTaluka) {
    route = await findRoute(plan.fromTaluka, plan.toTaluka);
    const [from, to] = await Promise.all([
      MasterItemModel.findOne({ type: "taluka", name: plan.fromTaluka }).select("parent").lean<{ parent?: string }>(),
      MasterItemModel.findOne({ type: "taluka", name: plan.toTaluka }).select("parent").lean<{ parent?: string }>(),
    ]);
    fromDistrict = from?.parent ?? "";
    toDistrict = to?.parent ?? "";
  }

  const distanceKm = route?.distanceKm ?? 0;
  const amounts = computeAmounts({ ...plan, distanceKm }, settings);

  const filter = { employeeId: employee.employeeId, expenseDate: istDayStart(dateKey) };
  const existing = await ExpenseModel.findOne(filter)
    .select("requestedExpenses")
    .lean<{ requestedExpenses?: number }>();
  const requested = existing?.requestedExpenses ?? 0;

  const set: Record<string, unknown> = {
    employeeName: employee.name,
    zone: employee.zone,
    division: employee.division,
    designation: employee.designation,
    workPlan: plan.workPlan,
    ...amounts,
    totalAmount: amounts.travelAllowance + amounts.workPlanAllowance + requested,
  };
  const unset: Record<string, ""> = {};
  if (plan.workPlan === "outstation") {
    Object.assign(set, {
      fromTaluka: plan.fromTaluka,
      fromDistrict,
      toTaluka: plan.toTaluka,
      toDistrict,
      distanceKm,
      travelMode: plan.travelMode,
      // Outstation stays "not arrived" until the employee taps Arrived in the app.
      arrivalStatus: "not-arrived",
    });
    if (route) set.routeId = route._id;
    else unset.routeId = "";
    if (plan.manualFare !== undefined) set.manualFare = plan.manualFare;
    else unset.manualFare = "";
  } else {
    // Head quarter / in city: there is nothing to travel to, so the day counts as arrived at once.
    Object.assign(set, { arrivalStatus: "arrived", arrivedAt: args.punchedInAt ?? new Date() });
    Object.assign(unset, {
      routeId: "",
      fromTaluka: "",
      fromDistrict: "",
      toTaluka: "",
      toDistrict: "",
      distanceKm: "",
      travelMode: "",
      manualFare: "",
      arrivalLocation: "",
      travelTimeMinutes: "",
    });
  }
  if (args.attendanceId) set.attendanceId = args.attendanceId;
  if (args.punchedInAt) set.punchedInAt = args.punchedInAt;

  return ExpenseModel.findOneAndUpdate(
    filter,
    {
      $set: set,
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
      $setOnInsert: { createdBy: { username: employee.username, name: employee.name } },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  ).lean();
}
