import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import EmployeeModel from "@/models/Employee";
import LocationPingModel from "@/models/LocationPing";

const MAX_BATCH = 500;
/** Fixes queued offline for longer than this are dropped as stale. */
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3;

function finite(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Receive a batch of GPS fixes. The app queues fixes while offline and sends
 * them together, so each one carries its own timestamp.
 *
 * Body: `{ points: [{ lat, lng, at, accuracy?, speed?, battery? }] }`
 */
export async function POST(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const body = await readJsonBody(request);
  const raw = Array.isArray(body?.points) ? (body.points as Record<string, unknown>[]) : [];

  const now = Date.now();
  const points = raw
    .slice(0, MAX_BATCH)
    .map((p) => {
      const lat = finite(p?.lat);
      const lng = finite(p?.lng);
      const at = new Date(String(p?.at ?? ""));
      if (lat === undefined || lng === undefined || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      if (Number.isNaN(at.getTime())) return null;
      // Allow a little clock skew on the phone, but nothing absurd.
      if (at.getTime() > now + 5 * 60 * 1000 || at.getTime() < now - MAX_AGE_MS) return null;
      return {
        employeeId: employee.employeeId,
        date: istDateKey(at),
        at,
        lat,
        lng,
        accuracy: finite(p?.accuracy),
        speed: finite(p?.speed),
        battery: finite(p?.battery),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  if (points.length > 0) {
    await LocationPingModel.insertMany(points, { ordered: false });

    const latest = points[points.length - 1];
    await EmployeeModel.updateOne(
      {
        _id: employee.employeeId,
        // Never move the marker backwards when an old offline batch arrives late.
        $or: [{ "lastLocation.at": { $lt: latest.at } }, { "lastLocation.at": { $exists: false } }],
      },
      {
        lastLocation: {
          lat: latest.lat,
          lng: latest.lng,
          accuracy: latest.accuracy,
          battery: latest.battery,
          at: latest.at,
        },
      }
    );
  }

  await EmployeeModel.updateOne({ _id: employee.employeeId }, { lastSeenAt: new Date() });

  return NextResponse.json({ ok: true, accepted: points.length });
}
