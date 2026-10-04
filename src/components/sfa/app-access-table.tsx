"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Power, Search, Smartphone, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AppAccessRow = {
  id: string;
  code: string;
  name: string;
  designation: string;
  zone: string;
  contactNo: string;
  appUsername: string;
  appAccessEnabled: boolean;
  hasPassword: boolean;
  lastSeenAt: string | null;
  deviceInfo: string;
};

function suggestUsername(row: AppAccessRow) {
  const base = (row.code || row.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return base.slice(0, 40) || "employee";
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(8));
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

function lastSeen(iso: string | null) {
  if (!iso) return "Never signed in";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CredentialsDialog({
  row,
  onOpenChange,
}: {
  row: AppAccessRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {row && <CredentialsForm key={row.id} row={row} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CredentialsForm({ row, onClose }: { row: AppAccessRow; onClose: () => void }) {
  const router = useRouter();
  const [username, setUsername] = React.useState(() => row.appUsername || suggestUsername(row));
  const [password, setPassword] = React.useState(() => (row.hasPassword ? "" : generatePassword()));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issued, setIssued] = React.useState<{ username: string; password: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!row.hasPassword && !password) {
      setError("Set a password for the first login");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sfa/employees/${row.id}/app-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ...(password ? { password } : {}), enabled: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save the login");
        return;
      }
      toast.success(`App login saved for ${row.name}.`);
      // Show what to hand over once; the password is not retrievable later.
      if (password) setIssued({ username: data.item.appUsername, password });
      else onClose();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return issued ? (
          <div className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>Login ready</DialogTitle>
              <DialogDescription>
                Give these to {row.name}. The password is shown only now — it cannot be looked up later, only reset.
              </DialogDescription>
            </DialogHeader>
            <dl className="bg-muted grid gap-3 rounded-lg p-4 font-mono text-sm">
              <div>
                <dt className="text-muted-foreground font-sans text-xs">Login ID</dt>
                <dd className="select-all">{issued.username}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-sans text-xs">Password</dt>
                <dd className="select-all">{issued.password}</dd>
              </div>
            </dl>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(`NBC Labs app\nLogin ID: ${issued.username}\nPassword: ${issued.password}`)
                    .then(() => toast.success("Copied."));
                }}
              >
                Copy
              </Button>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>{row.hasPassword ? "Change app login" : "Create app login"}</DialogTitle>
              <DialogDescription>
                {row.name} will sign in to the NBC Labs mobile app with these. NBC Pedia logins do not work in that app.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="app-username">Login ID</Label>
              <Input
                id="app-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="off"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="app-password">
                {row.hasPassword ? "New password (leave blank to keep the current one)" : "Password"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="app-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
                  <Wand2 />
                  Generate
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save and enable
              </Button>
            </DialogFooter>
          </form>
  );
}

export function AppAccessTable({ rows }: { rows: AppAccessRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<AppAccessRow | null>(null);
  const [toggling, setToggling] = React.useState<string | null>(null);

  const filtered = rows.filter((row) =>
    `${row.name} ${row.code} ${row.appUsername} ${row.zone} ${row.designation}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  const enabledCount = rows.filter((row) => row.appAccessEnabled).length;

  async function toggle(row: AppAccessRow) {
    setToggling(row.id);
    try {
      const res = await fetch(`/api/sfa/employees/${row.id}/app-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !row.appAccessEnabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not change app access");
        return;
      }
      toast.success(row.appAccessEnabled ? `${row.name} is signed out of the app.` : `App access on for ${row.name}.`);
      router.refresh();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees"
            className="pl-9"
            aria-label="Search employees"
          />
        </div>
        <span className="text-muted-foreground text-sm">
          {enabledCount} of {rows.length} employees can use the app
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
          Add employees under People → Employees first, then give them an app login here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Login ID</TableHead>
                <TableHead>App access</TableHead>
                <TableHead className="hidden lg:table-cell">Last seen</TableHead>
                <TableHead className="hidden lg:table-cell">Device</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {[row.code, row.designation, row.zone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.appUsername || "—"}</TableCell>
                  <TableCell>
                    {row.appAccessEnabled ? (
                      <Badge>Enabled</Badge>
                    ) : row.appUsername ? (
                      <Badge variant="outline">Disabled</Badge>
                    ) : (
                      <Badge variant="secondary">No login</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                    {lastSeen(row.lastSeenAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden max-w-48 truncate text-sm lg:table-cell">
                    {row.deviceInfo ? (
                      <span className="flex items-center gap-1">
                        <Smartphone className="size-3 shrink-0" />
                        {row.deviceInfo}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                        <KeyRound />
                        {row.hasPassword ? "Reset login" : "Create login"}
                      </Button>
                      {row.hasPassword && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={row.appAccessEnabled ? "text-destructive hover:text-destructive" : undefined}
                          disabled={toggling === row.id}
                          onClick={() => toggle(row)}
                        >
                          {toggling === row.id ? <Loader2 className="animate-spin" /> : <Power />}
                          {row.appAccessEnabled ? "Disable" : "Enable"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CredentialsDialog row={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
