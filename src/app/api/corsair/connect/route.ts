import { generateOAuthUrl } from "corsair/oauth";
import { NextResponse, type NextRequest } from "next/server";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { getConnectionStatus, ServiceType } from "@/lib/connection";

const REDIRECT_URI = `${process.env.BETTER_AUTH_URL}/api/corsair/callback`;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const plugin = (request.nextUrl.searchParams.get("plugin") ?? "gmail") as ServiceType;

  // ── Connection limit: one account per service ──────────────────────────────
  const connections = await getConnectionStatus(session.user.id);
  const alreadyConnected =
    (plugin === "gmail" && connections.gmail) ||
    (plugin === "googlecalendar" && connections.googlecalendar);

  if (alreadyConnected) {
    // Redirect back to settings with a clear error message
    const settingsUrl = new URL(
      "/dashboard/settings",
      process.env.BETTER_AUTH_URL ?? request.url
    );
    settingsUrl.searchParams.set("error", "already_connected");
    settingsUrl.searchParams.set("service", plugin);
    return NextResponse.redirect(settingsUrl.toString());
  }

  const { url, state } = await generateOAuthUrl(corsair, plugin, {
    tenantId: session.user.id,
    redirectUri: REDIRECT_URI,
  });

  console.log(url);
  const response = NextResponse.redirect(url);

  response.cookies.set("corsair_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
