import Link from "next/link";
import { ArrowUpRight, ListChecks, ShieldCheck, UserPlus, Wallet } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentModel from "@/models/Payment";
import RegistrationModel from "@/models/Registration";

export default async function DashboardPage() {
  await connectToDatabase();

  const [
    totalRegistrations,
    pendingApprovals,
    pendingPaymentRequests,
    completedRegisters,
  ] = await Promise.all([
    RegistrationModel.countDocuments({}),
    RegistrationModel.countDocuments({ status: "pending" }),
    PaymentModel.countDocuments({ status: "pending" }),
    RegistrationModel.countDocuments({ status: "approved" }),
  ]);

  const stats = [
    {
      label: "Total Registrations",
      href: "/register/list",
      tone: "bg-blue-50 text-blue-700",
      value: totalRegistrations,
      icon: UserPlus,
    },
    {
      label: "Pending Approvals",
      href: "/register/list",
      tone: "bg-amber-50 text-amber-700",
      value: pendingApprovals,
      icon: ShieldCheck,
    },
    {
      label: "Pending Payment Requests",
      href: "/payment/request",
      tone: "bg-violet-50 text-violet-700",
      value: pendingPaymentRequests,
      icon: Wallet,
    },
    {
      label: "Completed Registers",
      href: "/register/approval-history",
      tone: "bg-teal-50 text-teal-700",
      value: completedRegisters,
      icon: ListChecks,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <AutoRefresh />
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[.16em] text-primary">WORKSPACE OVERVIEW</p>
        <h2 className="text-2xl font-semibold tracking-tight">Your work, at a glance</h2>
        <p className="text-muted-foreground text-sm">
          Overview of registrations, approvals and payments.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-xl outline-offset-4 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-primary">
          <Card className="h-full py-6">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="mt-3 text-4xl font-semibold tabular-nums">{stat.value.toLocaleString("en-IN")}</CardTitle>
              </div>
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                <stat.icon className="size-5" />
              </div>
            </CardHeader>
          </Card>
          </Link>
        ))}
      </div>
      <section className="mt-2 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-[#122b40] p-7 text-white sm:p-9">
          <p className="text-xs font-semibold tracking-[.16em] text-[#72ddd0]">KEEP THINGS MOVING</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">A clear path from request<br className="hidden sm:block" /> to completion.</h3>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Review registrations, follow up on approvals and keep your team&#39;s payments on track.</p>
          <Link href="/register/list" className="mt-7 inline-flex items-center gap-3 rounded-lg bg-[#72ddd0] px-4 py-3 text-sm font-semibold text-[#122b40] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4">Review registrations <ArrowUpRight className="size-4" /></Link>
        </div>
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <h3 className="text-lg font-semibold">Quick access</h3>
          <p className="mt-1 text-sm text-muted-foreground">Pick up where your team needs you.</p>
          <div className="mt-5 divide-y">
            {[{ href: "/payment/request", title: "Payment requests", detail: "Review and manage pending requests", icon: Wallet }, { href: "/register/approval-history", title: "Approval history", detail: "Track registration decisions", icon: ShieldCheck }, { href: "/users", title: "Team members", detail: "Manage workspace access", icon: UserPlus }].map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-4 rounded-lg py-4 outline-offset-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><item.icon className="size-5 shrink-0 text-primary" /><div className="flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><ArrowUpRight className="size-4 text-muted-foreground" /></Link>)}
          </div>
        </div>
      </section>
    </div>
  );
}
