import { Bot, Calendar, Mail, Moon, Search, Settings, Sun } from "lucide-react";
import { OrionLogo } from "../landing/orion-logo";
import Link from "next/link";

const nav = [
  { to: "/dashboard/email", label: "Email", icon: Mail },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/agent", label: "Agent", icon: Bot },
  // { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  pathname,
  theme,
  toggle,
}: {
  pathname: string;
  theme: string | undefined;
  toggle: () => void;
}) {
  return (
    <>
      <div className="h-16 px-5 flex items-center gap-2 border-b border-sidebar-border">
        <OrionLogo className="size-7" />
        <span className="font-semibold tracking-tight">Orion</span>
      </div>

      <div className="p-3">
        <button className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg bg-secondary border border-border text-muted-foreground text-sm hover:text-foreground transition-colors">
          <Search className="size-3.5" />
          <span className="text-xs">Search & commands</span>
          <kbd className="ml-auto text-[10px] font-mono">⌘K</kbd>
        </button>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-auto">
        {nav.map((n) => {
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              href={n.to}
              className={`flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border flex items-center gap-3">
        <div className="size-8 rounded-full bg-primary/20 grid place-items-center text-xs font-semibold text-primary">
          AL
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">Kaneki Ken</div>
          <div className="text-[10px] text-muted-foreground truncate">
            kanekiken@gmail.com
          </div>
        </div>
        <button
          onClick={toggle}
          className="size-7 grid place-items-center rounded hover:bg-secondary text-muted-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          )}
        </button>
      </div>
    </>
  );
}
