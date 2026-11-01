"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm = {
  username: "",
  name: "",
  mobileNumber: "",
  password: "",
  budgetLimit: "",
};

export function NewUserDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create user");
        return;
      }

      toast.success(`User "${data.user.username}" created.`);
      setForm(emptyForm);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setForm(emptyForm);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create Field User</DialogTitle>
            <DialogDescription>
              This account will be used to log into the mobile app. They will
              only ever see the registrations and payment requests they
              submit themselves.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => updateField("mobileNumber", e.target.value)}
              placeholder="Enter mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              10-digit mobile number (optional)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budgetLimit">Budget Limit (₹)</Label>
            <Input
              id="budgetLimit"
              type="number"
              min="0"
              step="0.01"
              value={form.budgetLimit}
              onChange={(e) => updateField("budgetLimit", e.target.value)}
              placeholder="Enter budget limit"
              required
            />
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
