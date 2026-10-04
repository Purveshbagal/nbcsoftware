import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The proxy (middleware) is the primary gate — it also clears a stray
  // field-role cookie so it can't bounce between /login and /dashboard.
  // This is a defense-in-depth fallback in case that ever changes.
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Skip to content</a>
      <AppSidebar user={{ name: session.name, username: session.username }} />
      <SidebarInset>
        <SiteHeader />
        <main id="main-content" className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-1 flex-col gap-4 p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
