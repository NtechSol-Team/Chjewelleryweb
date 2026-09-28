import { NextResponse, type NextRequest } from "next/server";

const CLIENT_AREAS = ["/welcome", "/catalogue", "/collections", "/jewellery", "/product", "/shortlist", "/profile"];

/**
 * Optimistic gate only: bounces requests without a session cookie before any
 * rendering happens. The authoritative check (revocation, idle timeout,
 * disabled accounts, access windows) runs against Postgres in requireClient /
 * requireAdmin on every protected render and API call.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (CLIENT_AREAS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!req.cookies.has("chj_client")) return NextResponse.redirect(new URL("/access?reason=required", req.url));
  }
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.has("chj_admin")) return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const res = NextResponse.next();
  // A private showroom should never be indexed, framed or cached by intermediaries.
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (pathname !== "/" && !pathname.startsWith("/_next")) res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|lottie).*)"],
};
