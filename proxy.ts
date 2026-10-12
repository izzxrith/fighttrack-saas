import { NextRequest, NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // CSRF defence in depth, on top of the SameSite=lax cookie. A browser always
  // sends an Origin header on cross-site writes. If it names a different host
  // than ours, reject. Tools like curl send no Origin and are allowed through,
  // because they don't carry a victim's cookie automatically.
  if (isApi && MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = null;
      }
      if (originHost !== req.headers.get("host")) {
        return NextResponse.json({ error: "Request blocked." }, { status: 403 });
      }
    }
  }

  const res = NextResponse.next();

  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }

  // API responses are per-user, so they must never be cached or shared.
  if (isApi) {
    res.headers.set("Cache-Control", "no-store");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};