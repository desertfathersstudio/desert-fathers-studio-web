import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://desertfathersstudio.com",
  "https://www.desertfathersstudio.com",
  "https://desert-fathers-studio-web.vercel.app",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin") ?? "";

  // ── CORS on API routes ────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Stripe webhook must accept requests from Stripe servers (no origin header)
    if (pathname === "/api/webhooks/stripe") {
      return NextResponse.next();
    }

    const isDev = process.env.NODE_ENV === "development";
    const originOk = !origin || isDev || ALLOWED_ORIGINS.includes(origin);

    if (!originOk) {
      console.warn("[SECURITY] Blocked CORS request from:", origin, "to", pathname);
      return new NextResponse(null, { status: 403 });
    }

    const res = NextResponse.next();
    if (origin && (isDev || ALLOWED_ORIGINS.includes(origin))) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,x-admin-key");
      res.headers.set("Vary", "Origin");
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all API routes. Skip static assets for performance.
    "/api/(.*)",
  ],
};
