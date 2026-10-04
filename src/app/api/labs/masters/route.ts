import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import MasterItemModel from "@/models/MasterItem";

/** The masters the app fills its dropdowns from. Nothing else is exposed. */
const APP_MASTERS = new Set([
  "call-objective",
  "post-call-info",
  "product-sample",
  "promotional-gift",
  "leave-reason",
  "expense-head",
  "mode-of-travel",
  "skipped-reason",
  "work-agenda",
  "doctor-speciality",
  "doctor-category",
  "qualification",
  "firm-type",
  "firm-category",
  "announcement",
  "faq-master",
]);

type Option = { name: string; description?: string; value?: number };

/** `?types=call-objective,product-sample` → `{ options: { "call-objective": [...] } }` */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const requested = (new URL(request.url).searchParams.get("types") ?? "")
    .split(",")
    .map((type) => type.trim())
    .filter((type) => APP_MASTERS.has(type));

  const options: Record<string, Option[]> = Object.fromEntries(
    requested.map((type) => [type, [] as Option[]])
  );

  if (requested.length > 0) {
    const items = await MasterItemModel.find({ type: { $in: requested }, isActive: true })
      .select("type name description value")
      .sort({ sortOrder: 1, name: 1 })
      .lean<(Option & { type: string })[]>();
    for (const item of items) {
      options[item.type]?.push({ name: item.name, description: item.description, value: item.value });
    }
  }

  return NextResponse.json({ options });
}
