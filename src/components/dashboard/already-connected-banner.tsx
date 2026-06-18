"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function AlreadyConnectedBanner({ service }: { service: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const serviceName =
    service === "gmail"
      ? "Gmail"
      : service === "googlecalendar"
      ? "Google Calendar"
      : service;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400">
      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
      <p className="flex-1">
        <span className="font-semibold">{serviceName} is already connected.</span>{" "}
        You can only connect one {serviceName} account per workspace. Disconnect the existing
        account first if you want to link a different one.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
