"use client";

import { useEffect, useRef } from "react";
import { dispatchCommand } from "@/lib/events";
import { useRouter, usePathname } from "next/navigation";

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const keyBuffer = useRef<string>("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if a modifier key is pressed (unless it's part of the shortcut like Ctrl+K)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return; // Ctrl+K is handled in CommandPalette itself
      }

      const key = e.key.toLowerCase();

      // Manage sequence buffer for 2-key shortcuts like "G I"
      keyBuffer.current += key;
      const buffer = keyBuffer.current;

      // Keep buffer short
      if (buffer.length > 2) {
        keyBuffer.current = buffer.slice(-2);
      }

      // Single key shortcuts
      if (key === "c") {
        e.preventDefault();
        dispatchCommand("email:compose");
      } else if (key === "/") {
        e.preventDefault();
        dispatchCommand("email:search");
      } else if (key === "j") {
        e.preventDefault();
        dispatchCommand("email:next");
      } else if (key === "k") {
        e.preventDefault();
        dispatchCommand("email:prev");
      } else if (key === "?") {
        e.preventDefault();
        dispatchCommand("app:toggle-shortcuts");
      }

      // Two key sequences (G + something)
      const isEmailRoute = pathname?.startsWith("/dashboard/email");

      if (buffer.endsWith("gi")) {
        e.preventDefault();
        if (!isEmailRoute) router.push("/dashboard/email");
        dispatchCommand("email:folder", "inbox");
        keyBuffer.current = "";
      } else if (buffer.endsWith("gs")) {
        e.preventDefault();
        if (!isEmailRoute) router.push("/dashboard/email");
        dispatchCommand("email:folder", "starred");
        keyBuffer.current = "";
      } else if (buffer.endsWith("gt")) {
        e.preventDefault();
        if (!isEmailRoute) router.push("/dashboard/email");
        dispatchCommand("email:folder", "sent");
        keyBuffer.current = "";
      } else if (buffer.endsWith("gd")) {
        e.preventDefault();
        if (!isEmailRoute) router.push("/dashboard/email");
        dispatchCommand("email:folder", "drafts");
        keyBuffer.current = "";
      } else if (buffer.endsWith("gr")) {
        e.preventDefault();
        if (!isEmailRoute) router.push("/dashboard/email");
        dispatchCommand("email:folder", "trash");
        keyBuffer.current = "";
      }

      // Clear buffer after 1 second of inactivity to prevent accidental triggers later
      clearTimeout((window as any).__shortcutTimeout);
      (window as any).__shortcutTimeout = setTimeout(() => {
        keyBuffer.current = "";
      }, 1000);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, pathname]);

  return <>{children}</>;
}
