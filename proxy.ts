import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — runs on the Edge before any page or API route renders.
 *
 * Strategy:
 *  - Protect /dashboard/* routes by checking for the better-auth session cookie.
 *  - If no session cookie is present → redirect to /signin immediately.
 *  - API routes under /api/* are handled by their own auth guards, so we skip them here.
 *  - All other public paths (/, /signin, /signup, /verify-email, etc.) pass through.
 *
 * This avoids a full server-side session DB query on every navigation — the
 * cookie presence check is nearly instant and happens at the CDN/Edge level.
 */

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token", // used in production (HTTPS)
];

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // If no session cookie → redirect to signin with return URL
  if (!hasSessionCookie(req)) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static (static files)
     *  - _next/image  (image optimisation)
     *  - favicon.ico
     *  - public files
     *  - API routes (have their own guards)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
