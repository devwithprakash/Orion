// src/app/dashboard/dashboard-shell.tsx

"use client";

import Sidebar from "@/components/dashboard/sidebar";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-sidebar flex-col">
        <Sidebar pathname={pathname} theme={theme} toggle={toggleTheme} />
      </aside>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-border flex flex-col md:hidden animate-in slide-in-from-left">
            <Sidebar pathname={pathname} theme={theme} toggle={toggleTheme} />
          </aside>
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 border-b border-border flex items-center justify-between glass z-10 gap-3">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden size-9 grid place-items-center rounded-lg hover:bg-secondary"
          >
            <Menu className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
