import { processOAuthCallback } from "corsair/oauth";
import { NextResponse, type NextRequest } from "next/server";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  triggerInitialGmailSync,
} from "@/lib/sync/gmail-sync";
import {
  triggerInitialCalendarSync,
} from "@/lib/sync/calendar-sync";

const REDIRECT_URI = `${process.env.BETTER_AUTH_URL}/api/corsair/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  if (!session.user.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email first" },
      { status: 403 },
    );
  }

  if (!code || !state) {
    const response = new NextResponse("Missing code or state.", {
      status: 400,
    });
    response.cookies.delete("corsair_oauth_state");
    return response;
  }

  const storedState = request.cookies.get("corsair_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    const response = new NextResponse("Invalid state.", { status: 400 });
    response.cookies.delete("corsair_oauth_state");
    return response;
  }

  try {
    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    const plugin = result.plugin || "unknown";

    if (plugin === "gmail") {
      // Trigger initial Gmail sync
      triggerInitialGmailSync(userId).catch((e) => console.error(e));
    }

    if (plugin === "googlecalendar") {
      // Trigger initial Calendar sync
      triggerInitialCalendarSync(userId).catch((e) => console.error(e));
    }

    const response = NextResponse.redirect(
      `${process.env.BETTER_AUTH_URL}/dashboard/email?connected=${encodeURIComponent(result.plugin)}`,
    );
    response.cookies.set("corsair_oauth_state", "", {
      path: "/",
      expires: new Date(0),
    });

    console.log("Final response", response);
    return response;
  } catch (error) {
    console.error("Corsair OAuth callback failed:", error);
    const response = new NextResponse("OAuth failed.", { status: 500 });
    response.cookies.delete("corsair_oauth_state");
    return response;
  }
}
