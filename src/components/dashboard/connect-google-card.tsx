"use client";

import {
  Mail,
  Calendar as CalendarIcon,
  LogOut,
  Wifi,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ConnectGoogleCard({
  service,
  forceNotConnected,
}: {
  service: "gmail" | "googlecalendar";
  forceNotConnected?: boolean;
}) {
  const queryClient = useQueryClient();
  const isGmail = service === "gmail";

  const { data: conn } = useQuery({
    queryKey: ["connection-status"],
    queryFn: async () => {
      const res = await fetch("/api/connection/status");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ gmail: boolean; googlecalendar: boolean }>;
    },
    staleTime: 1000 * 60 * 5,
  });

  const isConnected = conn?.[service] && !forceNotConnected;

  const handleConnect = () => {
    window.location.href = `/api/corsair/connect?plugin=${service}`;
  };

  const handleReconnect = () => {
    window.location.href = `/api/corsair/connect?plugin=${service}`;
  };

  const ServiceIcon = isGmail ? Mail : CalendarIcon;
  const serviceName = isGmail ? "Gmail" : "Google Calendar";

  // ── Connected state ───────────────────────────────────────────────────────
  if (isConnected) {

    return (
      <div className="h-full flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
                  <ServiceIcon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{serviceName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync status removed as requested */}

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center gap-2">
              <button
                onClick={handleReconnect}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border text-xs hover:bg-secondary transition-colors"
              >
                <Wifi className="size-3.5" />
                Reconnect
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/connection/disconnect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ service }),
                    });
                    if (!res.ok) throw new Error("Failed to disconnect");
                    toast.success(`${serviceName} disconnected successfully`);
                    queryClient.invalidateQueries({ queryKey: ["connection-status"] });
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-destructive/20 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="size-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not connected state ───────────────────────────────────────────────────
    const perms = isGmail
      ? ["Read and send emails", "Manage labels and threads", "Access attachments"]
      : ["View and manage events", "Create and delete events", "Access calendar details"];

    return (
  <div className="flex h-full items-center justify-center p-6">
    <div className="max-w-sm text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <ServiceIcon className="size-6 text-primary" />
      </div>

      <h2 className="text-lg font-semibold">
        Connect {serviceName}
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        {isGmail
          ? "Connect your Gmail account to view emails, send messages, and keep your inbox synchronized."
          : "Connect Google Calendar to view events, manage schedules, and stay organized."}
      </p>

      <button
        onClick={handleConnect}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        <ServiceIcon className="size-4" />
        Connect {serviceName}
      </button>
    </div>
  </div>
    );
}
