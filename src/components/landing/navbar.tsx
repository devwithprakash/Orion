"use client";

import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { OrionLogo } from "./orion-logo";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { data: session } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("orion-agent-chat");
    }
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border glass">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <OrionLogo />
          <span className="font-semibold text-lg tracking-tight">Orion</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="size-9 grid place-items-center rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            {mounted &&
              (theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              ))}
          </button>
          
          {session ? (
            <>
              <Link
                href="/dashboard/email"
                className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden sm:inline-flex bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden size-9 grid place-items-center rounded-lg border border-border"
            aria-label="Menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      
      {open && (
        <div className="md:hidden border-t border-border bg-background px-5 py-4 space-y-3">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="block text-sm"
          >
            Features
          </a>
          <a
            href="#product"
            onClick={() => setOpen(false)}
            className="block text-sm"
          >
            Product
          </a>
          
          {session ? (
            <>
              <Link href="/dashboard/email" className="block text-sm py-1">
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-center bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="block text-sm py-1">
                Login
              </Link>
              <Link
                href="/signup"
                className="block text-center bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
