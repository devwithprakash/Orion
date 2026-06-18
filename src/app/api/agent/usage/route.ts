import { auth } from "@/lib/auth";
import { getDailyUsage } from "@/lib/agent/usage";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/agent/usage
 * Returns the current daily AI usage for the authenticated user.
 */
export const GET = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const usage = await getDailyUsage(session.user.id);
  return NextResponse.json(usage);
};
