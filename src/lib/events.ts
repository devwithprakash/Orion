import { useEffect } from "react";

/**
 * Dispatch a global command event.
 */
export const dispatchCommand = (action: string, payload?: any) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("app:command", { detail: { action, payload } })
    );
  }
};

/**
 * React hook to listen to global commands.
 */
export const useCommand = (action: string, callback: (payload?: any) => void) => {
  useEffect(() => {
    const handler = (e: CustomEvent<{ action: string; payload?: any }>) => {
      if (e.detail.action === action) {
        callback(e.detail.payload);
      }
    };
    window.addEventListener("app:command", handler as EventListener);
    return () => window.removeEventListener("app:command", handler as EventListener);
  }, [action, callback]);
};
