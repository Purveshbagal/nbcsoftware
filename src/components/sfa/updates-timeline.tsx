"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";

type Update = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeUsername: string;
  updateText: string;
  updateDate: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  createdAt: string;
};

type Props = {
  updates: Update[];
};

export function UpdatesTimeline({ updates }: Props) {
  const router = useRouter();

  const groupedByDate = updates.reduce((acc, update) => {
    const date = update.updateDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(update);
    return acc;
  }, {} as Record<string, Update[]>);

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <User className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4">No updates yet from employees</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(groupedByDate).map(([date, dateUpdates]) => (
        <div key={date} className="flex flex-col gap-3">
          <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 py-2 backdrop-blur">
            <Badge variant="outline" className="font-semibold">
              {formatDate(date)}
            </Badge>
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">
              {dateUpdates.length} {dateUpdates.length === 1 ? "update" : "updates"}
            </span>
          </div>

          <div className="grid gap-3">
            {dateUpdates.map((update) => (
              <Card
                key={update.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() =>
                  router.push(
                    `/sfa/overview/updates/${update.employeeId}?name=${encodeURIComponent(update.employeeName)}`
                  )
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {update.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{update.employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            @{update.employeeUsername}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed">{update.updateText}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(update.createdAt)}
                        </div>
                        {update.location?.latitude && update.location?.longitude && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <a
                              href={`https://www.google.com/maps?q=${update.location.latitude},${update.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View location
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
