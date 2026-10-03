"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Eye, EyeOff, ArrowRight, ShieldCheck, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-[#122b40] px-7 py-8 text-white sm:px-12 lg:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 top-28 size-[32rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-48 size-[22rem] rounded-full border border-white/10 bg-teal-300/5" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#72ddd0] text-[#122b40]"><GraduationCap className="size-7" /></div>
          <div><p className="text-xl font-semibold tracking-tight">NBC Pedia</p><p className="text-xs tracking-[.18em] text-slate-300">OPERATIONS WORKSPACE</p></div>
        </div>
        <div className="relative hidden max-w-lg py-12 lg:block lg:py-24">
          <p className="mb-5 text-xs font-semibold tracking-[.2em] text-[#72ddd0]">CONNECTED TEAMS. CLEARER WORK.</p>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">A better way<br />to move work<br /><span className="text-[#72ddd0]">forward.</span></h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">Bring registrations, approvals and payments together in one focused workspace.</p>
          <div className="mt-10 hidden gap-3 sm:flex">
            {["Registrations", "Approvals", "Payments"].map((label) => <span key={label} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-slate-200">{label}</span>)}
          </div>
        </div>
        <p className="relative hidden text-xs text-slate-400 lg:block">NBC Pedia / Administration & field operations</p>
      </section>
      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="w-full max-w-[410px]">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl border border-border bg-white text-primary"><ShieldCheck className="size-6" /></div>
          <p className="mb-3 text-xs font-semibold tracking-[.16em] text-primary">ADMIN PORTAL</p>
          <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in to manage your team&#39;s everyday work.</p>
          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-6" aria-busy={loading}>
            <div className="grid gap-2.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" autoComplete="username" placeholder="Enter your username" className="h-12 bg-white px-4" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="h-12 bg-white pr-14 pl-4" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </div>
            {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="h-12 w-full text-sm shadow-sm" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}{loading ? "Signing in..." : "Sign in to workspace"}{!loading && <ArrowRight className="ml-auto size-4" />}</Button>
          </form>
          <p className="mt-6 text-center text-xs leading-6 text-muted-foreground">Need access or help signing in?<br />Contact your NBC Pedia administrator.</p>
          <div className="mt-12 flex items-center justify-center gap-2 border-t pt-6 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />For authorized team members</div>
        </div>
      </section>
    </main>
  );
}
