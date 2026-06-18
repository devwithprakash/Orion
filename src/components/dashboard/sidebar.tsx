"use client";

import { Bot, Calendar, Mail, Moon, Search, Settings, Sun, LogOut, ChevronDown } from "lucide-react";
import { OrionLogo } from "../landing/orion-logo";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const nav = [
  { to: "/dashboard/email", label: "Email", icon: Mail, service: "gmail" as const },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar, service: "googlecalendar" as const },
  { to: "/dashboard/agent", label: "Agent", icon: Bot },
];

export default function Sidebar({
  pathname,
  theme,
  toggle,
  session,
}: {
  pathname: string;
  theme: string | undefined;
  toggle: () => void;
  session: { user: { name?: string | null; email?: string | null; image?: string | null } };
}) {
  const { data: connectionStatus } = useConnectionStatus();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  // Count unread emails from infinite query cache
  const { data: emailData } = useInfiniteQuery({
    queryKey: ["gmail-threads"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/gmail/threads", window.location.origin);
      url.searchParams.set("limit", "25");
      if (pageParam) url.searchParams.set("pageToken", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: any) => lastPage.nextPageToken ?? undefined,
    enabled: !!connectionStatus?.gmail,
    staleTime: 1000 * 30,
  });

  const unreadCount = emailData?.pages
    .flatMap((p: any) => p.threads ?? [])
    .filter((t: any) => t.unread).length ?? 0;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/");
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const userInitials = userName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/">
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors">
          <OrionLogo className="size-6" />
          <span className="font-semibold tracking-tight text-sm">Orion</span>
        </div>
      </Link>

      {/* Search / command */}
      <div className="px-3 pt-3 pb-1">
        <button className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg bg-sidebar-accent/40 border border-sidebar-border text-muted-foreground text-xs hover:text-foreground hover:bg-sidebar-accent/60 transition-colors">
          <Search className="size-3.5 shrink-0" />
          <span>Search & commands</span>
          <kbd className="ml-auto text-[10px] font-mono opacity-60">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-auto">
        {nav.map((n) => {
          const active = pathname.startsWith(n.to);
          const isConnected = n.service ? connectionStatus?.[n.service] : true;
          const isEmail = n.service === "gmail";

          return (
            <Link
              key={n.to}
              href={n.to}
              className={`flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-all ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40"
              }`}
            >
              <div className="relative shrink-0">
                <n.icon className="size-4" />
                {n.service && isConnected && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 ring-1 ring-sidebar" />
                )}
              </div>
              <span className="flex-1">{n.label}</span>
              {isEmail && isConnected && unreadCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium grid place-items-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        {/* Settings link */}
        <Link href={"/dashboard/settings"} className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-colors">
          <Settings className="size-4" />
          Settings
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* User row + sign out */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-3 h-11 rounded-lg hover:bg-sidebar-accent/40 transition-colors mt-1"
          >
            <div className="size-7 rounded-full bg-primary/20 grid place-items-center text-[11px] font-semibold text-primary uppercase shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-medium truncate">{userName}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {userEmail}
              </div>
            </div>
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-popover border border-border rounded-xl shadow-elevated overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-xs font-medium">{userName}</p>
                  <p className="text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
