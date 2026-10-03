"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { allNavItems } from "@/components/app-sidebar";

export function SiteHeader() {
  const pathname = usePathname();
  const current = allNavItems.find((item) => item.url === pathname);

  return (
    <header className="sticky top-0 z-20 flex h-18 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-md md:px-8">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-base font-medium">{current?.title ?? "NBC Pedia"}</h1>
      <span className="ml-auto hidden rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">Administration workspace</span>
    </header>
  );
}
