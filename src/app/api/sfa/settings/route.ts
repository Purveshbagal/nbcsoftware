import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { findSettingGroup } from "@/lib/settings-schema";
import SettingModel from "@/models/Setting";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = new URL(request.url).searchParams.get("group");
  if (!group || !findSettingGroup(group)) {
    return NextResponse.json({ error: "Unknown settings group" }, { status: 400 });
  }

  await connectToDatabase();
  const rows = await SettingModel.find({ group }).lean<{ key: string; value: string }[]>();

  return NextResponse.json({
    values: Object.fromEntries(rows.map((row) => [row.key, row.value])),
  });
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as
    | { group?: string; values?: Record<string, unknown> }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const definition = body.group ? findSettingGroup(body.group) : undefined;

  if (!definition) {
    return NextResponse.json({ error: "Unknown settings group" }, { status: 400 });
  }

  await connectToDatabase();

  // Only keys the group declares are stored, so an unexpected payload is ignored.
  const writes = definition.fields.map((field) => ({
    updateOne: {
      filter: { group: definition.slug, key: field.key },
      update: {
        $set: {
          value: String(body.values?.[field.key] ?? ""),
          updatedBy: { username: session.username, name: session.name },
        },
      },
      upsert: true,
    },
  }));

  await SettingModel.bulkWrite(writes);

  return NextResponse.json({ ok: true });
}
