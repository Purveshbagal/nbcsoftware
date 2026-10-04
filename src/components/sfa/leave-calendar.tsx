"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CalendarEntry = {
  _id: string;
  label: string;
  detail: string;
  fromDate: string;
  toDate: string;
  tone: "leave" | "holiday" | "work";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TONE_CLASS: Record<CalendarEntry["tone"], string> = {
  leave: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  holiday: "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200",
  work: "bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-200",
};

/** `YYYY-MM-DD` for a local date, avoiding the UTC shift `toISOString` applies. */
function toKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function LeaveCalendar({ entries }: { entries: CalendarEntry[] }) {
  const today = React.useMemo(() => new Date(), []);
  const [cursor, setCursor] = React.useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const from = new Date(entry.fromDate);
      const to = new Date(entry.toDate || entry.fromDate);
      if (Number.isNaN(from.getTime())) continue;

      const end = Number.isNaN(to.getTime()) ? from : to;
      // Walk the range so a multi-day leave shows on every day it covers.
      for (
        let day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        day <= end;
        day.setDate(day.getDate() + 1)
      ) {
        const key = toKey(day);
        map.set(key, [...(map.get(key) ?? []), entry]);
      }
    }
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          <ChevronRight />
        </Button>
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
        >
          Today
        </Button>
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className={TONE_CLASS.leave}>Leave</Badge>
          <Badge variant="secondary" className={TONE_CLASS.holiday}>Holiday</Badge>
          <Badge variant="secondary" className={TONE_CLASS.work}>Working day</Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="bg-muted/50 grid grid-cols-7 border-b">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-muted-foreground p-2 text-center text-xs font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={`blank-${index}`} className="bg-muted/20 min-h-24 border-r border-b" />;
            }
            const key = toKey(new Date(year, month, day));
            const dayEntries = byDay.get(key) ?? [];
            const isToday = key === toKey(today);

            return (
              <div key={key} className="min-h-24 border-r border-b p-1.5 align-top">
                <span
                  className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEntries.slice(0, 3).map((entry) => (
                    <span
                      key={`${entry._id}-${key}`}
                      title={`${entry.label} — ${entry.detail}`}
                      className={`truncate rounded px-1.5 py-0.5 text-[11px] ${TONE_CLASS[entry.tone]}`}
                    >
                      {entry.label}
                    </span>
                  ))}
                  {dayEntries.length > 3 && (
                    <span className="text-muted-foreground px-1.5 text-[11px]">
                      +{dayEntries.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
