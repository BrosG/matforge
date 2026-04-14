import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware that runs on EVERY request.
 *
 * 1. Overrides Next.js ISR cache headers (s-maxage=31536000) that cause
 *    Google Frontend / CDN to serve year-old HTML after deploys.
 * 2. Protects /dashboard/* routes (requires valid NextAuth JWT).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets (content-hashed) — cache forever, skip middleware
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Dashboard auth protection
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // All other routes: override cache headers to prevent stale content
  const response = NextResponse.next();

  // Kill the ISR s-maxage=31536000 that Next.js sets on SSG pages
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, s-maxage=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // Security headers
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Exclude:
    //  - _next/static, _next/image, favicon.ico (static assets)
    //  - api/auth/*    (NextAuth routes must return untouched JSON; stamping
    //                   Cache-Control / security headers on them can cause
    //                   stale HTML to be served by CDNs, which breaks
    //                   signIn() with "t is not iterable")
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
