"use client";

import * as React from "react";
import type * as Leaflet from "leaflet";
import { ArrowLeft, BatteryMedium, Loader2, MapPin, RefreshCw, Route, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LiveEmployee = {
  id: string;
  name: string;
  designation: string;
  zone: string;
  lastLocation: { lat: number; lng: number; accuracy?: number; battery?: number; at: string } | null;
  lastSeenAt: string | null;
  punchInAt: string | null;
  punchOutAt: string | null;
  visitsToday: number;
  /** Today's route as `[lat, lng, epochMs]`. */
  trail: [number, number, number][];
};

type TrailVisit = {
  _id: string;
  visitType: string;
  doctor?: string;
  firm?: string;
  status?: string;
  callObjective?: string;
  pobValue?: number;
  geo?: { lat?: number; lng?: number };
  checkInAt?: string;
};

type Punch = { at?: string; lat?: number; lng?: number };

type Trail = {
  date: string;
  employee: { id: string; name: string };
  points: { at: string; lat: number; lng: number; battery?: number }[];
  distanceKm: number;
  visits: TrailVisit[];
  attendance: { punchIn?: Punch; punchOut?: Punch; workingMinutes?: number; workAgenda?: string } | null;
};

const REFRESH_MS = 30_000;
/** No fix for this long while on duty means the phone has gone quiet. */
const STALE_MS = 15 * 60_000;
const INDIA_CENTER: [number, number] = [20.59, 78.96];
/** A silence longer than this between two fixes is drawn as "no signal". */
const GAP_MS = 15 * 60_000;
/** One route colour per employee on the live map. */
const ROUTE_COLORS = ["#2563eb", "#db2777", "#ea580c", "#7c3aed", "#0891b2", "#65a30d", "#c026d3", "#b45309"];

type RoutePoint = { lat: number; lng: number; t: number };

function metersBetween(a: RoutePoint, b: RoutePoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(h));
}

/** Compass bearing from a to b, in degrees clockwise from north. */
function bearing(a: RoutePoint, b: RoutePoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Draw a route the way a maps app does: a coloured line with a white casing,
 * arrows showing the direction of travel, and dashed grey where the phone
 * went quiet. `timeDots` adds a dot every 15 minutes that shows the time.
 */
function drawRoute(
  L: typeof Leaflet,
  group: Leaflet.LayerGroup,
  points: RoutePoint[],
  options: { color: string; weight: number; label?: string; timeDots?: boolean; arrowCount?: number }
) {
  if (points.length < 2) return;
  const { color, weight, label, timeDots = false, arrowCount = 20 } = options;

  // Split where the phone went quiet, so a gap is not drawn as a road.
  const segments: RoutePoint[][] = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const point = points[i];
    if (point.t - previous.t > GAP_MS) {
      L.polyline(
        [
          [previous.lat, previous.lng],
          [point.lat, point.lng],
        ],
        { color: "#64748b", weight: 3, opacity: 0.8, dashArray: "6 8" }
      )
        .bindTooltip(
          `No signal ${clock(new Date(previous.t).toISOString())} – ${clock(new Date(point.t).toISOString())}`,
          { sticky: true }
        )
        .addTo(group);
      segments.push([point]);
    } else {
      segments[segments.length - 1].push(point);
    }
  }

  for (const segment of segments) {
    if (segment.length < 2) continue;
    const latLngs = segment.map((p) => [p.lat, p.lng] as [number, number]);
    L.polyline(latLngs, { color: "#ffffff", weight: weight + 4, opacity: 0.9, lineJoin: "round", lineCap: "round" }).addTo(group);
    const line = L.polyline(latLngs, { color, weight, opacity: 0.95, lineJoin: "round", lineCap: "round" }).addTo(group);
    if (label) line.bindTooltip(label, { sticky: true });
  }

  // Direction arrows, spaced evenly along the parts actually travelled.
  // Gaps count for nothing, or arrows would land off the line after one.
  const isGap = (a: RoutePoint, b: RoutePoint) => b.t - a.t > GAP_MS;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    if (!isGap(points[i - 1], points[i])) total += metersBetween(points[i - 1], points[i]);
  }
  const spacing = Math.max(150, total / arrowCount);
  let travelled = 0;
  let nextArrow = spacing / 2;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (isGap(a, b)) continue;
    const hop = metersBetween(a, b);
    if (hop > 0) {
      while (travelled + hop >= nextArrow) {
        const f = (nextArrow - travelled) / hop;
        const at: [number, number] = [a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f];
        L.marker(at, {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "",
            html: `<svg width="18" height="18" viewBox="0 0 14 14" style="transform:rotate(${bearing(a, b)}deg);display:block"><path d="M7 1 L12.5 12 L7 9.2 L1.5 12 Z" fill="${color}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        }).addTo(group);
        nextArrow += spacing;
      }
    }
    travelled += hop;
  }

  if (timeDots) {
    let nextDot = points[0].t + GAP_MS;
    for (const point of points) {
      if (point.t < nextDot) continue;
      L.circleMarker([point.lat, point.lng], { radius: 4, color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 })
        .bindTooltip(clock(new Date(point.t).toISOString()), { direction: "top" })
        .addTo(group);
      nextDot = point.t + GAP_MS;
    }
  }
}

function dutyState(employee: LiveEmployee) {
  if (employee.punchOutAt) return { label: "Day ended", tone: "outline" as const, color: "#64748b" };
  if (employee.punchInAt) {
    const at = employee.lastLocation ? Date.parse(employee.lastLocation.at) : 0;
    if (Date.now() - at > STALE_MS) return { label: "No signal", tone: "destructive" as const, color: "#dc2626" };
    return { label: "On duty", tone: "default" as const, color: "#0d9488" };
  }
  return { label: "Not punched in", tone: "secondary" as const, color: "#94a3b8" };
}

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function clock(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function todayIst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function TrackingMap() {
  const mapElement = React.useRef<HTMLDivElement>(null);
  const leaflet = React.useRef<typeof Leaflet | null>(null);
  const map = React.useRef<Leaflet.Map | null>(null);
  const layer = React.useRef<Leaflet.LayerGroup | null>(null);
  const fittedOnce = React.useRef(false);

  const [ready, setReady] = React.useState(false);
  const [employees, setEmployees] = React.useState<LiveEmployee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);
  const [showRoutes, setShowRoutes] = React.useState(true);

  const [selected, setSelected] = React.useState<LiveEmployee | null>(null);
  const [date, setDate] = React.useState(todayIst);
  const [trail, setTrail] = React.useState<Trail | null>(null);
  const [trailLoading, setTrailLoading] = React.useState(false);

  // Leaflet touches `window`, so it is loaded only in the browser.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapElement.current || map.current) return;
      leaflet.current = L;
      map.current = L.map(mapElement.current, { zoomControl: true }).setView(INDIA_CENTER, 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const loadLive = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sfa/tracking/live", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load live locations");
      setEmployees(data.items);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load live locations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll like a subscription: the first load is queued, not run in the effect body.
  React.useEffect(() => {
    const first = window.setTimeout(loadLive, 0);
    const timer = window.setInterval(loadLive, REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [loadLive]);

  const loadTrail = React.useCallback(async (employeeId: string, day: string) => {
    setTrailLoading(true);
    try {
      const res = await fetch(`/api/sfa/tracking/trail?employeeId=${employeeId}&date=${day}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load the route");
      setTrail(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the route");
    } finally {
      setTrailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!selected) return;
    const load = () => loadTrail(selected.id, date);
    const first = window.setTimeout(load, 0);
    // Today's route keeps growing, so follow it like the live view does.
    const timer = date === todayIst() ? window.setInterval(load, REFRESH_MS) : undefined;
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [selected, date, loadTrail]);

  // Live view: one marker per employee at their last fix.
  React.useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L || !layer.current || selected) return;
    layer.current.clearLayers();

    const group = layer.current;
    const bounds: [number, number][] = [];
    employees.forEach((employee, index) => {
      const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
      const hasRoute = showRoutes && employee.trail.length > 1;
      if (hasRoute) {
        const points = employee.trail.map(([lat, lng, t]) => ({ lat, lng, t }));
        drawRoute(L, group, points, { color: routeColor, weight: 4, label: employee.name, arrowCount: 8 });
        L.circleMarker([points[0].lat, points[0].lng], { radius: 5, color: "#fff", weight: 2, fillColor: routeColor, fillOpacity: 1 })
          .bindTooltip(`${employee.name} · started ${clock(new Date(points[0].t).toISOString())}`)
          .addTo(group);
        for (const point of points) bounds.push([point.lat, point.lng]);
      }

      if (!employee.lastLocation) return;
      const { lat, lng } = employee.lastLocation;
      const state = dutyState(employee);
      bounds.push([lat, lng]);
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:${state.color};color:#fff;border:3px solid ${hasRoute ? routeColor : "#fff"};border-radius:999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font:600 12px system-ui;box-shadow:0 2px 6px rgba(0,0,0,.35)">${escapeHtml(initials(employee.name))}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        title: employee.name,
      })
        .bindPopup(
          `<strong>${escapeHtml(employee.name)}</strong><br/>${escapeHtml(employee.designation || "")}` +
            `<br/>${state.label} · seen ${timeAgo(employee.lastLocation.at)}` +
            (employee.lastLocation.battery !== undefined ? `<br/>Battery ${employee.lastLocation.battery}%` : "") +
            `<br/>Visits today: ${employee.visitsToday}`
        )
        .on("click", () => {
          setTrail(null);
          setSelected(employee);
          setDate(todayIst());
        })
        .addTo(group);
    });

    if (bounds.length > 0 && !fittedOnce.current) {
      map.current?.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
      fittedOnce.current = true;
    }
  }, [employees, ready, selected, showRoutes]);

  // Route view: the day's trail, punches and visits.
  React.useEffect(() => {
    const L = leaflet.current;
    const group = layer.current;
    if (!ready || !L || !group || !selected || !trail) return;
    group.clearLayers();

    const route: RoutePoint[] = trail.points.map((p) => ({ lat: p.lat, lng: p.lng, t: Date.parse(p.at) }));
    const bounds: [number, number][] = route.map((p) => [p.lat, p.lng]);
    drawRoute(L, group, route, { color: "#0d9488", weight: 5, timeDots: true, arrowCount: 25 });

    const dot = (color: string, label: string) =>
      L.divIcon({
        className: "",
        html: `<div style="background:${color};color:#fff;border:2px solid #fff;border-radius:999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:700 11px system-ui;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

    const punchIn = trail.attendance?.punchIn;
    if (punchIn?.lat !== undefined && punchIn?.lng !== undefined) {
      bounds.push([punchIn.lat, punchIn.lng]);
      L.marker([punchIn.lat, punchIn.lng], { icon: dot("#16a34a", "IN") })
        .bindPopup(`<strong>Punched in</strong><br/>${clock(punchIn.at)}`)
        .addTo(group);
    }
    const punchOut = trail.attendance?.punchOut;
    if (punchOut?.lat !== undefined && punchOut?.lng !== undefined) {
      bounds.push([punchOut.lat, punchOut.lng]);
      L.marker([punchOut.lat, punchOut.lng], { icon: dot("#dc2626", "OUT") })
        .bindPopup(`<strong>Punched out</strong><br/>${clock(punchOut.at)}`)
        .addTo(group);
    }

    trail.visits.forEach((visit, index) => {
      if (visit.geo?.lat === undefined || visit.geo?.lng === undefined) return;
      bounds.push([visit.geo.lat, visit.geo.lng]);
      const subject = visit.doctor || visit.firm || "Visit";
      L.marker([visit.geo.lat, visit.geo.lng], { icon: dot("#7c3aed", String(index + 1)) })
        .bindPopup(
          `<strong>${escapeHtml(subject)}</strong><br/>${visit.visitType === "firm" ? "Firm" : "Doctor"} visit · ${escapeHtml(visit.status ?? "")}` +
            `<br/>${clock(visit.checkInAt)}` +
            (visit.callObjective ? `<br/>${escapeHtml(visit.callObjective)}` : "") +
            (visit.pobValue ? `<br/>POB ₹${visit.pobValue.toLocaleString("en-IN")}` : "")
        )
        .addTo(group);
    });

    const last = trail.points[trail.points.length - 1];
    if (last && !punchOut?.at) {
      L.circleMarker([last.lat, last.lng], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: "#0d9488",
        fillOpacity: 1,
      })
        .bindPopup(`<strong>Latest position</strong><br/>${clock(last.at)}`)
        .addTo(group);
    }

    if (bounds.length > 0) {
      map.current?.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    }
  }, [trail, ready, selected]);

  const filtered = employees.filter((employee) =>
    `${employee.name} ${employee.zone} ${employee.designation}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const onDuty = employees.filter((e) => e.punchInAt && !e.punchOutAt).length;

  return (
    <div className="grid min-h-[640px] flex-1 gap-4 lg:grid-cols-[340px_1fr]">
      <aside className="bg-card flex min-h-0 flex-col rounded-xl border">
        {selected ? (
          <div className="flex flex-col gap-4 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setSelected(null);
                setTrail(null);
              }}
            >
              <ArrowLeft />
              All employees
            </Button>
            <div>
              <p className="text-lg font-semibold">{selected.name}</p>
              <p className="text-muted-foreground text-sm">
                {[selected.designation, selected.zone].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Day</span>
              <Input type="date" value={date} max={todayIst()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </label>

            {trailLoading && !trail ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" /> Loading route…
              </p>
            ) : trail ? (
              <>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Punch in</dt>
                    <dd className="font-semibold">{clock(trail.attendance?.punchIn?.at)}</dd>
                  </div>
                  <div className="rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Punch out</dt>
                    <dd className="font-semibold">{clock(trail.attendance?.punchOut?.at)}</dd>
                  </div>
                  <div className="rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Distance</dt>
                    <dd className="font-semibold tabular-nums">{trail.distanceKm.toFixed(1)} km</dd>
                  </div>
                  <div className="rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Visits</dt>
                    <dd className="font-semibold tabular-nums">{trail.visits.length}</dd>
                  </div>
                </dl>
                {trail.attendance?.workAgenda && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Agenda: </span>
                    {trail.attendance.workAgenda}
                  </p>
                )}
                {trail.points.length === 0 ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                    No location trail recorded for this day.
                  </p>
                ) : (
                  <ul className="text-muted-foreground grid gap-1.5 text-xs">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-6 rounded-full bg-teal-600" /> Route taken, arrows show direction
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 border-t-2 border-dashed border-slate-500" /> No signal (phone was offline)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex w-6 justify-center">
                        <span className="size-2 rounded-full bg-teal-600 ring-2 ring-white" />
                      </span>
                      Every 15 min, hover for the time
                    </li>
                  </ul>
                )}
                {trail.visits.length > 0 && (
                  <ol className="divide-y overflow-y-auto rounded-lg border text-sm">
                    {trail.visits.map((visit, index) => (
                      <li key={visit._id} className="flex gap-3 p-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{visit.doctor || visit.firm}</p>
                          <p className="text-muted-foreground text-xs">
                            {clock(visit.checkInAt)} · {visit.status}
                            {!visit.geo?.lat && " · no GPS"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-semibold">{onDuty}</span>
                  <span className="text-muted-foreground"> of {employees.length} on duty</span>
                </p>
                <Button variant="ghost" size="sm" onClick={loadLive} aria-label="Refresh">
                  <RefreshCw />
                </Button>
              </div>
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search employees"
                  className="pl-9"
                  aria-label="Search employees"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                />
                Show today&apos;s routes on the map
              </label>
              {updatedAt && (
                <p className="text-muted-foreground text-xs">
                  Updated {updatedAt.toLocaleTimeString("en-IN")} · refreshes every 30 s
                </p>
              )}
            </div>
            <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
              {loading ? (
                <li className="text-muted-foreground flex items-center gap-2 p-4 text-sm">
                  <Loader2 className="size-4 animate-spin" /> Loading…
                </li>
              ) : filtered.length === 0 ? (
                <li className="text-muted-foreground p-4 text-sm">
                  {employees.length === 0
                    ? "No employee has app access yet. Give logins under People → Mobile App Access."
                    : "No match."}
                </li>
              ) : (
                filtered.map((employee) => {
                  const state = dutyState(employee);
                  const routeColor = ROUTE_COLORS[employees.indexOf(employee) % ROUTE_COLORS.length];
                  return (
                    <li key={employee.id}>
                      <button
                        type="button"
                        className="hover:bg-muted flex w-full items-start gap-3 p-4 text-left"
                        onClick={() => {
                          setTrail(null);
                          setSelected(employee);
                          setDate(todayIst());
                          if (employee.lastLocation) {
                            map.current?.setView([employee.lastLocation.lat, employee.lastLocation.lng], 14);
                          }
                        }}
                      >
                        <span
                          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{
                            background: state.color,
                            // The ring matches this employee's route colour on the map.
                            boxShadow:
                              showRoutes && employee.trail.length > 1 ? `0 0 0 3px ${routeColor}` : undefined,
                          }}
                        >
                          {initials(employee.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{employee.name}</span>
                            <Badge variant={state.tone}>{state.label}</Badge>
                          </span>
                          <span className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {timeAgo(employee.lastLocation?.at ?? null)}
                            </span>
                            {employee.lastLocation?.battery !== undefined && (
                              <span className="flex items-center gap-1">
                                <BatteryMedium className="size-3" />
                                {employee.lastLocation.battery}%
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Route className="size-3" />
                              {employee.visitsToday} visits
                            </span>
                            {employee.punchInAt && <span>In {clock(employee.punchInAt)}</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}
        {error && (
          <p className="text-destructive border-t p-3 text-sm" role="alert">
            {error}
          </p>
        )}
      </aside>

      <div className="relative min-h-[480px] overflow-hidden rounded-xl border">
        <div ref={mapElement} className="absolute inset-0 z-0" aria-label="Employee map" />
        {trailLoading && trail && (
          <div className="bg-background/90 absolute top-3 right-3 z-[400] flex items-center gap-2 rounded-md px-3 py-1.5 text-xs shadow">
            <Loader2 className="size-3 animate-spin" /> Updating
          </div>
        )}
      </div>
    </div>
  );
}
