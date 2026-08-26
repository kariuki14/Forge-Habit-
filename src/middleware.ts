import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Centralized auth guard.
 *
 * Runs on the Edge runtime (no DB call here — just checks for the session
 * cookie existence). The full session validity check (expiry, DB lookup)
 * still happens inside each protected layout, so this is a fast first-line
 * redirect, not a replacement for server-side validation.
 */

// Routes that require a valid session.
const PROTECTED_PREFIXES = ["/today", "/habits", "/goals", "/insights", "/settings"];

// Routes that should redirect *away* if already logged in.
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Redirect unauthenticated users away from protected pages.
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      // Preserve the intended destination so the login page can redirect back.
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect already-authenticated users away from auth pages.
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/today";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes EXCEPT:
   *  - Next.js internals (_next/static, _next/image)
   *  - API routes (auth validation happens inside each route handler)
   *  - Static assets (favicon, icons, public files)
   */
  matcher: ["/((?!_next/static|_next/image|api/|favicon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
