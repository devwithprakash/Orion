"use client";

import { Mail, Calendar as CalendarIcon, Wifi, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

const SERVICE_META = {
  gmail: {
    label: "Gmail",
    description: "Send emails, draft replies, and manage your inbox through Orion.",
    Icon: Mail,
    connectHref: "/api/corsair/connect?plugin=gmail",
    permissions: ["Read and send emails", "Manage labels and threads"],
  },
  googlecalendar: {
    label: "Google Calendar",
    description: "Create events, schedule meetings, and add attendees from a single prompt.",
    Icon: CalendarIcon,
    connectHref: "/api/corsair/connect?plugin=googlecalendar",
    permissions: ["Create and manage events", "Add attendees to events"],
  },
} as const;

type Service = keyof typeof SERVICE_META;

export function SettingsIntegrationCard({ service }: { service: Service }) {
  const meta = SERVICE_META[service];
  const { Icon } = meta;
  const queryClient = useQueryClient();
  const [disconnecting, setDisconnecting] = useState(false);

  const { data: conn, isLoading } = useQuery({
    queryKey: ["connection-status"],
    queryFn: async () => {
      const res = await fetch("/api/connection/status");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ gmail: boolean; googlecalendar: boolean }>;
    },
    staleTime: 1000 * 60 * 5,
  });

  const isConnected = conn?.[service] ?? false;

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/connection/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success(`${meta.label} disconnected`);
      queryClient.invalidateQueries({ queryKey: ["connection-status"] });
    } catch {
      toast.error(`Could not disconnect ${meta.label}. Please try again.`);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-all">
      {/* Icon */}
      <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${
        isConnected ? "bg-primary/10" : "bg-secondary"
      }`}>
        <Icon className={`size-5 ${isConnected ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{meta.label}</span>
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : isConnected ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="size-3" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              <AlertCircle className="size-3" />
              Not connected
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meta.description}</p>
        <div className="flex flex-wrap gap-x-3 mt-1.5">
          {meta.permissions.map((p) => (
            <span key={p} className="text-[10px] text-muted-foreground/70">
              · {p}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isConnected ? (
          <>
            <button
              onClick={() => { window.location.href = meta.connectHref; }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Wifi className="size-3.5" />
              Reconnect
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-destructive/20 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {disconnecting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </>
        ) : (
          <button
            onClick={() => { window.location.href = meta.connectHref; }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Icon className="size-3.5" />
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
