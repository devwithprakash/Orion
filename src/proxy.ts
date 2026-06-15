import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // handling local + production cookies
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isDashboardPage = pathname.startsWith("/dashboard");

  // Not logged in
  if (!sessionCookie && isDashboardPage) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Logged in
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard/email", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password/:path*",
  ],
};
