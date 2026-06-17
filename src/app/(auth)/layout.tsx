import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect verified users away from auth pages back to the dashboard
  if (session?.user.emailVerified) {
    redirect("/dashboard/email");
  }

  return <div>{children}</div>;
}
