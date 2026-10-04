"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SettingGroup } from "@/lib/settings-schema";

export function SettingsForm({
  group,
  values,
}: {
  group: SettingGroup;
  values: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(group.fields.map((field) => [field.key, values[field.key] ?? ""]))
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update(key: string, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/sfa/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: group.slug, values: form }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save these settings");
        return;
      }

      toast.success("Settings saved.");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card flex max-w-3xl flex-col gap-5 rounded-xl border p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {group.fields.map((field) => {
          const id = `setting-${field.key}`;
          const isWide = field.type === "textarea";

          return (
            <div key={field.key} className={`grid gap-2 ${isWide ? "sm:col-span-2" : ""}`}>
              {field.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm" htmlFor={id}>
                  <input
                    id={id}
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={form[field.key] === "true"}
                    onChange={(event) => update(field.key, String(event.target.checked))}
                  />
                  {field.label}
                </label>
              ) : (
                <>
                  <Label htmlFor={id}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      rows={3}
                      value={form[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={form[field.key] || null}
                      onValueChange={(value) => update(field.key, (value as string) ?? "")}
                    >
                      <SelectTrigger id={id} className="w-full">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={id}
                      type={field.type === "number" ? "number" : "text"}
                      value={form[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                    />
                  )}
                </>
              )}
              {field.help && <p className="text-muted-foreground text-xs">{field.help}</p>}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
