// src/app/dashboard/layout.tsx

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "./dashboard-shell";
import { ShortcutProvider } from "@/components/providers/shortcut-provider";
import { CommandPalette } from "@/components/dashboard/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }

  return (
    <ShortcutProvider>
      <DashboardShell session={session}>{children}</DashboardShell>
      <CommandPalette />
    </ShortcutProvider>
  );
}
