"use client";

import Sidebar from "@/components/dashboard/sidebar";
import { OrionLogo } from "@/components/landing/orion-logo";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/email": "Inbox",
  "/dashboard/calendar": "Calendar",
  "/dashboard/agent": "Agent",
  "/dashboard/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key)) return title;
  }
  return "Dashboard";
}

export default function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: { user: { name?: string | null; email?: string | null; image?: string | null } };
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-sidebar flex-col">
        <Sidebar pathname={pathname} theme={theme} toggle={toggleTheme} session={session} />
      </aside>

      {/* Mobile drawer backdrop */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-border flex flex-col md:hidden animate-in slide-in-from-left duration-200">
            <Sidebar pathname={pathname} theme={theme} toggle={toggleTheme} session={session} />
          </aside>
        </>
      )}

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 px-4 sm:px-5 border-b border-border flex items-center justify-between glass z-10 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden size-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors shrink-0"
            >
              <Menu className="size-4" />
            </button>
            {/* Brand — visible on mobile only */}
            <div className="flex items-center gap-2 md:hidden shrink-0">
              <OrionLogo className="size-5" />
              <span className="font-semibold text-sm tracking-tight">Orion</span>
            </div>
            {/* Desktop page title */}
            <h1 className="hidden md:block text-sm font-semibold tracking-tight">{pageTitle}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">{children}</div>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden h-14 border-t border-border bg-background flex items-center justify-around shrink-0 z-10 pb-safe">
          <Link href="/dashboard/email" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname.startsWith("/dashboard/email") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span className="text-[10px] font-medium">Email</span>
          </Link>
          <Link href="/dashboard/calendar" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname.startsWith("/dashboard/calendar") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span className="text-[10px] font-medium">Calendar</span>
          </Link>
          <Link href="/dashboard/agent" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname.startsWith("/dashboard/agent") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            <span className="text-[10px] font-medium">Agent</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
