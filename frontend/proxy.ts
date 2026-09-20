import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "blog_session";

/**
 * Optimistic cookie-presence check only — no DB/auth call here, since Proxy
 * runs on every /admin request. A present-but-expired cookie is caught by
 * app/admin/layout.tsx's real GET /user check instead.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
