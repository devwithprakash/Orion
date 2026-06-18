"use client";

import {
  Mail,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type SyncState = {
  status: "not_started" | "pending" | "syncing" | "synced" | "failed";
  lastSyncAt: string | null;
  errorMessage: string | null;
  retryCount: number;
};

function useSyncState(service: "gmail" | "googlecalendar") {
  return useQuery({
    queryKey: ["sync-state", service],
    queryFn: async () => {
      const endpoint = service === "gmail" ? "/api/sync/gmail" : "/api/sync/calendar";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch sync state");
      return res.json() as Promise<SyncState>;
    },
    staleTime: 1000 * 30,
    refetchInterval: 10000,
  });
}

export function ConnectGoogleCard({
  service,
  forceNotConnected,
}: {
  service: "gmail" | "googlecalendar";
  forceNotConnected?: boolean;
}) {
  const queryClient = useQueryClient();
  const isGmail = service === "gmail";

  const { data: syncState, isLoading: syncLoading } = useSyncState(service);
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

  const syncMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isGmail ? "/api/sync/gmail" : "/api/sync/calendar";
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success(`${isGmail ? "Gmail" : "Calendar"} sync started`);
      queryClient.invalidateQueries({ queryKey: ["sync-state", service] });
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [isGmail ? "gmail-threads" : "calendar-events"],
        });
      }, 3000);
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
    const isSyncing =
      syncState?.status === "syncing" || syncMutation.isPending;
    const hasFailed = syncState?.status === "failed";
    const lastSync = syncState?.lastSyncAt
      ? formatDistanceToNow(new Date(syncState.lastSyncAt), { addSuffix: true })
      : null;

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

            {/* Sync status */}
            <div className="px-5 py-4 space-y-3">
              {/* Status row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isSyncing ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Syncing…</span>
                    </>
                  ) : hasFailed ? (
                    <>
                      <AlertCircle className="size-3.5 text-destructive" />
                      <span className="text-destructive">Sync failed</span>
                    </>
                  ) : syncState?.status === "synced" ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span>Up to date</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="size-3.5 text-muted-foreground" />
                      <span>Not synced yet</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-3 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  Sync now
                </button>
              </div>

              {/* Last sync */}
              {lastSync && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  Last synced {lastSync}
                </div>
              )}

              {/* Error message */}
              {hasFailed && syncState?.errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive">
                    {syncState.errorMessage}
                  </p>
                </div>
              )}

              {/* Retry count warning */}
              {(syncState?.retryCount ?? 0) >= 3 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Multiple sync failures detected. Try reconnecting your
                    account.
                  </p>
                </div>
              )}
            </div>

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
