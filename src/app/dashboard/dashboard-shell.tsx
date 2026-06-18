// src/app/dashboard/dashboard-shell.tsx

"use client";

import Sidebar from "@/components/dashboard/sidebar";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
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
              className="md:hidden size-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="size-4" />
            </button>
            <h1 className="text-sm font-semibold tracking-tight">{pageTitle}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
