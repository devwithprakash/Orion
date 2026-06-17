"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  Search,
  PenSquare,
  RefreshCw,
} from "lucide-react";
import { dispatchCommand } from "@/lib/events";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle palette with Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Listen to open events from other components (if needed)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("app:open-cmdk", handler);
    return () => window.removeEventListener("app:open-cmdk", handler);
  }, []);

  const runCommand = (action: () => void) => {
    setOpen(false);
    action();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 pt-[10vh]">
      <Command
        className="max-w-[600px] w-full mx-auto bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        label="Global Command Menu"
        shouldFilter={true}
      >
        <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="flex-1 h-12 bg-transparent outline-none px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Actions" className="text-xs text-muted-foreground font-medium px-2 py-1.5">
            <Command.Item
              onSelect={() => runCommand(() => dispatchCommand("email:compose"))}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <PenSquare className="size-4" /> Compose Email
              <Shortcut>C</Shortcut>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => dispatchCommand("email:search"))}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <Search className="size-4" /> Search Emails
              <Shortcut>/</Shortcut>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => dispatchCommand("email:refresh"))}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <RefreshCw className="size-4" /> Refresh Inbox
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Navigation" className="text-xs text-muted-foreground font-medium px-2 py-1.5">
            <Command.Item
              onSelect={() => runCommand(() => {
                router.push("/dashboard/email");
                dispatchCommand("email:folder", "inbox");
              })}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <Inbox className="size-4" /> Go to Inbox
              <Shortcut>G I</Shortcut>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                router.push("/dashboard/email");
                dispatchCommand("email:folder", "starred");
              })}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <Star className="size-4" /> Go to Starred
              <Shortcut>G S</Shortcut>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                router.push("/dashboard/email");
                dispatchCommand("email:folder", "sent");
              })}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <Send className="size-4" /> Go to Sent
              <Shortcut>G T</Shortcut>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                router.push("/dashboard/email");
                dispatchCommand("email:folder", "drafts");
              })}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <FileText className="size-4" /> Go to Drafts
              <Shortcut>G D</Shortcut>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => {
                router.push("/dashboard/email");
                dispatchCommand("email:folder", "trash");
              })}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer aria-selected:bg-secondary aria-selected:text-primary transition-colors"
            >
              <Trash2 className="size-4" /> Go to Trash
              <Shortcut>G R</Shortcut>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>

      {/* Invisible overlay for closing when clicking outside */}
      <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-auto flex items-center gap-1 rounded bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
