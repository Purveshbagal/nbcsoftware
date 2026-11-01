"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, MapPin, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

type Update = {
  id: string;
  updateText: string;
  updateDate: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  createdAt: string;
};

type Props = {
  employeeId: string;
  employeeName: string;
  updates: Update[];
  selectedDate?: string;
};

export function EmployeeUpdateHistory({ employeeId, employeeName, updates, selectedDate }: Props) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );

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
      year: "numeric",
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const dateStr = format(newDate, "yyyy-MM-dd");
      router.push(`/sfa/overview/updates/${employeeId}?name=${encodeURIComponent(employeeName)}&date=${dateStr}`);
    } else {
      router.push(`/sfa/overview/updates/${employeeId}?name=${encodeURIComponent(employeeName)}`);
    }
  };

  const clearDateFilter = () => {
    setDate(undefined);
    router.push(`/sfa/overview/updates/${employeeId}?name=${encodeURIComponent(employeeName)}`);
  };

  const groupedByDate = updates.reduce((acc, update) => {
    const date = update.updateDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(update);
    return acc;
  }, {} as Record<string, Update[]>);

  return (
    <div className="flex flex-col gap-4">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filter by Date</CardTitle>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilter}
                className="h-8"
              >
                <X className="mr-1 h-4 w-4" />
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={!selectedDate ? "default" : "outline"}
            size="sm"
            onClick={clearDateFilter}
          >
            All updates
          </Button>
          <Button
            variant={
              selectedDate === new Date().toISOString().split("T")[0]
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => handleDateSelect(new Date())}
          >
            Today
          </Button>
          <Button
            variant={
              selectedDate === new Date(Date.now() - 86400000).toISOString().split("T")[0]
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => handleDateSelect(new Date(Date.now() - 86400000))}
          >
            Yesterday
          </Button>
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date && selectedDate ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Updates Timeline */}
      {updates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4">
              {selectedDate
                ? `No updates posted on ${formatDate(selectedDate)}`
                : "No updates posted yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groupedByDate).map(([dateKey, dateUpdates]) => (
            <div key={dateKey} className="flex flex-col gap-3">
              <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 py-2 backdrop-blur">
                <Badge variant="outline" className="font-semibold">
                  {formatDate(dateKey)}
                </Badge>
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">
                  {dateUpdates.length} {dateUpdates.length === 1 ? "update" : "updates"}
                </span>
              </div>

              <div className="grid gap-3">
                {dateUpdates.map((update, index) => (
                  <Card key={update.id}>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <Badge variant="secondary" className="text-xs">
                          Update #{dateUpdates.length - index}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(update.createdAt)}
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {update.updateText}
                      </p>

                      {update.location?.latitude && update.location?.longitude && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <a
                            href={`https://www.google.com/maps?q=${update.location.latitude},${update.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {update.location.latitude.toFixed(6)}, {update.location.longitude.toFixed(6)}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
