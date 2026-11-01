"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Holiday = {
  name: string;
  date: string;
  enabled: boolean;
  autoFetch: boolean;
};

export default function HolidaySettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);

  const [sundayIsWorkingDay, setSundayIsWorkingDay] = React.useState(false);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [lastFetchedAt, setLastFetchedAt] = React.useState<string | null>(null);

  // Fetch settings
  React.useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/sfa/hr/holiday-settings");
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to fetch settings");
          return;
        }

        setSundayIsWorkingDay(data.sundayIsWorkingDay || false);
        setHolidays(data.holidays || []);
        setLastFetchedAt(data.lastFetchedAt || null);
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Save settings
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/sfa/hr/holiday-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sundayIsWorkingDay,
          holidays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      toast.success("Settings saved successfully");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Fetch holidays from Google
  async function handleFetchHolidays() {
    setFetching(true);
    try {
      const res = await fetch("/api/sfa/hr/holiday-settings/fetch", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch holidays");
        return;
      }

      setHolidays(data.holidays || []);
      setLastFetchedAt(data.lastFetchedAt || null);
      toast.success("Holidays updated successfully");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setFetching(false);
    }
  }

  // Toggle holiday enabled
  function toggleHoliday(index: number) {
    const updated = [...holidays];
    updated[index].enabled = !updated[index].enabled;
    setHolidays(updated);
  }

  // Update holiday date
  function updateHolidayDate(index: number, date: string) {
    const updated = [...holidays];
    updated[index].date = date;
    setHolidays(updated);
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sunday Working Day Setting */}
      <Card>
        <CardHeader>
          <CardTitle>Working Days</CardTitle>
          <CardDescription>
            Configure whether Sunday is a working day or holiday
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sunday-toggle" className="text-base font-medium">
                Sunday is Working Day
              </Label>
              <p className="text-muted-foreground text-sm">
                When disabled, Sundays are automatically marked as holidays with auto-present
              </p>
            </div>
            <Switch
              id="sunday-toggle"
              checked={sundayIsWorkingDay}
              onCheckedChange={setSundayIsWorkingDay}
            />
          </div>
        </CardContent>
      </Card>

      {/* Holidays List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Annual Holidays</CardTitle>
              <CardDescription>
                Manage public holidays. Dates are auto-updated from Google Calendar yearly.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchHolidays}
              disabled={fetching}
            >
              <RefreshCw className={fetching ? "animate-spin" : ""} />
              Fetch Holidays
            </Button>
          </div>
          {lastFetchedAt && (
            <p className="text-muted-foreground text-xs">
              Last updated:{" "}
              {new Date(lastFetchedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Auto-Fetch</TableHead>
                  <TableHead className="text-right">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={holiday.date}
                        onChange={(e) => updateHolidayDate(index, e.target.value)}
                        className="w-[160px]"
                      />
                    </TableCell>
                    <TableCell>
                      {holiday.autoFetch ? (
                        <span className="text-sm text-green-600">Yes</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={holiday.enabled}
                        onCheckedChange={() => toggleHoliday(index)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
