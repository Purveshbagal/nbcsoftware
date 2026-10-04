import { NextResponse } from "next/server";
import type { Model } from "mongoose";

import { getSessionFromRequest } from "@/lib/auth";
import { readJsonBody } from "@/lib/read-json";
import { connectToDatabase } from "@/lib/mongodb";

type FieldKind = "string" | "number" | "boolean" | "stringArray";

export type FieldSpec = Record<string, FieldKind>;

export type CrudOptions = {
  /** Writable fields and how to coerce each one. Anything else is ignored. */
  fields: FieldSpec;
  /** Fields that must be non-empty on create. */
  required?: string[];
  /** Default sort for the list endpoint. */
  sort?: Record<string, 1 | -1>;
  /** Query-string keys that filter the list, mapped onto document fields. */
  filters?: Record<string, string>;
  /** Fields searched by `?q=`. */
  searchFields?: string[];
  /** Values forced onto every create, e.g. a fixed `visitType`. */
  defaults?: Record<string, unknown>;
  /** Human name used in error messages. */
  label: string;
};

function coerce(kind: FieldKind, raw: unknown) {
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
      if (typeof raw === "string") {
        return raw
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }
      return [];
    default:
      return typeof raw === "string" ? raw.trim() : raw === undefined || raw === null ? "" : String(raw);
  }
}

/** Pick and coerce the writable fields present in `body`. */
function pickFields(body: Record<string, unknown>, fields: FieldSpec, all: boolean) {
  const out: Record<string, unknown> = {};
  for (const [field, kind] of Object.entries(fields)) {
    if (!all && !(field in body)) continue;
    out[field] = coerce(kind, body[field]);
  }
  return out;
}

async function requireAdmin(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

/**
 * The model is typed loosely on purpose: these handlers only ever touch fields
 * declared in `options.fields`, so the per-schema types add no safety here.
 */
type SfaModel = Model<Record<string, unknown>>;

/** GET (list) and POST (create) for a collection. */
export function collectionRoutes(getModel: () => SfaModel, options: CrudOptions) {
  async function GET(request: Request) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const query: Record<string, unknown> = { ...(options.defaults ?? {}) };

    for (const [param, field] of Object.entries(options.filters ?? {})) {
      const value = url.searchParams.get(param);
      if (value) query[field] = value;
    }

    const search = url.searchParams.get("q")?.trim();
    if (search && options.searchFields?.length) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = options.searchFields.map((field) => ({
        [field]: { $regex: escaped, $options: "i" },
      }));
    }

    await connectToDatabase();
    const items = await getModel()
      .find(query)
      .sort(options.sort ?? { createdAt: -1 })
      .limit(Number(url.searchParams.get("limit") ?? 500))
      .lean();

    return NextResponse.json({ items });
  }

  async function POST(request: Request) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const doc = { ...pickFields(body, options.fields, true), ...(options.defaults ?? {}) };

    for (const field of options.required ?? []) {
      const value = doc[field];
      if (value === "" || value === null || value === undefined) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();
    const created = await getModel().create({
      ...doc,
      createdBy: { username: auth.session!.username, name: auth.session!.name },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  }

  return { GET, POST };
}

/** PATCH (update) and DELETE for one document. */
export function itemRoutes(getModel: () => SfaModel, options: CrudOptions) {
  async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const update = pickFields(body, options.fields, false);

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await connectToDatabase();
    const item = await getModel()
      .findByIdAndUpdate(id, update, { returnDocument: "after" })
      .lean();

    if (!item) {
      return NextResponse.json({ error: `${options.label} not found` }, { status: 404 });
    }

    return NextResponse.json({ item });
  }

  async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    await connectToDatabase();
    const item = await getModel().findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json({ error: `${options.label} not found` }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  return { PATCH, DELETE };
}
