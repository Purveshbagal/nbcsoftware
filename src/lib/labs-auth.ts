import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

import { connectToDatabase } from "@/lib/mongodb";
import EmployeeModel from "@/models/Employee";

/**
 * Sign-in for the NBC Labs employee mobile app.
 *
 * These tokens are signed with a key derived from AUTH_SECRET plus a fixed
 * suffix, and carry their own audience. The admin session check in
 * `@/lib/auth` therefore rejects them, and admin tokens are rejected here —
 * an NBC Pedia login cannot reach this app and an employee login cannot reach
 * the admin API.
 */

const AUDIENCE = "nbc-labs-employee";
const TOKEN_DURATION = 60 * 60 * 24 * 30; // 30 days — field staff stay signed in

function getEmployeeKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable");
  }
  return new TextEncoder().encode(`${secret}:${AUDIENCE}`);
}

export type EmployeeTokenPayload = {
  employeeId: string;
  username: string;
  name: string;
};

export async function createEmployeeToken(payload: EmployeeTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_DURATION}s`)
    .sign(getEmployeeKey());
}

async function verifyEmployeeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getEmployeeKey(), { audience: AUDIENCE });
    return payload as unknown as EmployeeTokenPayload;
  } catch {
    return null;
  }
}

export type EmployeeContext = {
  employeeId: string;
  name: string;
  username: string;
  zone: string;
  division: string;
  designation: string;
};

type EmployeeLean = {
  _id: { toString(): string };
  name: string;
  appUsername?: string;
  zone?: string;
  division?: string;
  designation?: string;
  isActive?: boolean;
  appAccessEnabled?: boolean;
};

/**
 * Resolve the signed-in employee for a mobile request. The employee record is
 * re-read on every call so that deactivating someone, or switching off their
 * app access, signs them out immediately rather than when the token expires.
 */
export async function requireEmployee(
  request: Request
): Promise<{ employee: EmployeeContext; error?: never } | { error: NextResponse; employee?: never }> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const payload = token ? await verifyEmployeeToken(token) : null;

  if (!payload) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await connectToDatabase();
  const doc = await EmployeeModel.findById(payload.employeeId)
    .select("name appUsername zone division designation isActive appAccessEnabled")
    .lean<EmployeeLean>();

  if (!doc || doc.isActive === false || !doc.appAccessEnabled) {
    return {
      error: NextResponse.json(
        { error: "Your app access has been switched off. Contact your administrator." },
        { status: 401 }
      ),
    };
  }

  return {
    employee: {
      employeeId: doc._id.toString(),
      name: doc.name,
      username: doc.appUsername ?? payload.username,
      zone: doc.zone ?? "",
      division: doc.division ?? "",
      designation: doc.designation ?? "",
    },
  };
}

/** The India-time calendar day (YYYY-MM-DD) for `date`. */
export function istDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * A trail fit for drawing: fixes with poor accuracy are dropped, and so is any
 * fix within `minMeters` of the last one kept, which removes the jitter of
 * someone standing still without losing the turns of a road.
 */
export function thinTrail<T extends { lat: number; lng: number; accuracy?: number | null }>(
  points: T[],
  minMeters = 10
): T[] {
  const kept: T[] = [];
  for (const point of points) {
    if (point.accuracy && point.accuracy > 100) continue;
    const previous = kept[kept.length - 1];
    if (previous && haversineKm(previous, point) * 1000 < minMeters) continue;
    kept.push(point);
  }
  return kept;
}

/**
 * Length of a GPS trail, ignoring hops that are almost certainly noise: fixes
 * with poor accuracy, and jitter under 20 m while standing still.
 */
export function trailDistanceKm(
  points: { lat: number; lng: number; accuracy?: number | null }[]
) {
  let total = 0;
  let previous: { lat: number; lng: number } | null = null;
  for (const point of points) {
    if (point.accuracy && point.accuracy > 100) continue;
    if (previous) {
      const hop = haversineKm(previous, point);
      if (hop < 0.02) continue;
      total += hop;
    }
    previous = point;
  }
  return Math.round(total * 100) / 100;
}
