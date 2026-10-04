import { NextResponse } from "next/server";
import type { Model } from "mongoose";

import { requireEmployee, type EmployeeContext } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import type { FieldSpec } from "@/lib/sfa-crud";

/**
 * GET/POST for a collection the employee app reads and writes. Unlike the
 * admin factory in sfa-crud, everything here is scoped to the signed-in
 * employee: the list only returns their own rows, and a create is stamped
 * with their name, zone and division whatever the body says. Review fields
 * (status, reviewedBy) are never writable from the app.
 */
export type EmployeeCrudOptions = {
  label: string;
  /** Fields the app may set. Anything else in the body is ignored. */
  fields: FieldSpec;
  required?: string[];
  sort: Record<string, 1 | -1>;
  /** Field holding the employee's name. */
  ownerField?: string;
  /** Values forced onto every create, e.g. `status: "pending"`. */
  defaults?: Record<string, unknown>;
  /** Query-string keys that filter the list, mapped onto document fields. */
  filters?: Record<string, string>;
  /**
   * Called before a create, for numbering or derived values. Throw an Error to
   * reject the request; its message goes back to the app as a 400.
   */
  prepare?: (doc: Record<string, unknown>, employee: EmployeeContext) => Promise<void> | void;
};

type AnyModel = Model<Record<string, unknown>>;

function coerce(kind: FieldSpec[string], raw: unknown) {
  switch (kind) {
    case "number": {
      if (raw === "" || raw === null || raw === undefined) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "boolean":
      return Boolean(raw);
    case "stringArray":
      if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
      if (typeof raw === "string") return raw.split(",").map((v) => v.trim()).filter(Boolean);
      return [];
    default:
      return raw === undefined || raw === null ? "" : String(raw).trim();
  }
}

export function employeeCollectionRoutes(getModel: () => AnyModel, options: EmployeeCrudOptions) {
  const ownerField = options.ownerField ?? "employeeName";

  async function GET(request: Request) {
    const auth = await requireEmployee(request);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const query: Record<string, unknown> = { [ownerField]: auth.employee.name };
    for (const [param, field] of Object.entries(options.filters ?? {})) {
      const value = url.searchParams.get(param);
      if (value) query[field] = value;
    }

    const items = await getModel()
      .find(query)
      .sort(options.sort)
      .limit(Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 500))
      .lean();

    return NextResponse.json({ items });
  }

  async function POST(request: Request) {
    const auth = await requireEmployee(request);
    if (auth.error) return auth.error;

    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const doc: Record<string, unknown> = {};
    for (const [field, kind] of Object.entries(options.fields)) {
      doc[field] = coerce(kind, body[field]);
    }

    for (const field of options.required ?? []) {
      const value = doc[field];
      if (value === "" || value === null || value === undefined) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const { employee } = auth;
    Object.assign(doc, options.defaults ?? {}, {
      [ownerField]: employee.name,
      createdBy: { username: employee.username, name: employee.name },
    });
    if ("zone" in getModel().schema.paths) doc.zone = employee.zone;
    if ("division" in getModel().schema.paths) doc.division = employee.division;

    try {
      await options.prepare?.(doc, employee);
    } catch (error) {
      // A throw from `prepare` is a validation message meant for the user.
      const message = error instanceof Error ? error.message : `Could not save this ${options.label.toLowerCase()}`;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const created = await getModel().create(doc);
    return NextResponse.json({ item: created }, { status: 201 });
  }

  return { GET, POST };
}

/** A short running number such as `LV-20261004-4821`. */
export function referenceNumber(prefix: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `${prefix}-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}
