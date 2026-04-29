import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const WHITELISTED_EMAILS = ["desertfathersstudio@gmail.com"];

export async function proxy(request: NextRequest) {
  const host    = request.headers.get("host") ?? "";
  const url     = request.nextUrl.clone();
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  // ── Step 1: subdomain / query-param routing ───────────────────────
  let isAdminRequest = false;

  if (isLocal) {
    const front = url.searchParams.get("front");
    if (front === "wholesale") {
      url.searchParams.delete("front");
      url.pathname = `/wholesale-portal${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    if (front === "admin") {
      url.searchParams.delete("front");
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    // Direct /admin/* path in dev
    isAdminRequest = url.pathname.startsWith("/admin");
  } else {
    const subdomain = host.split(".")[0];
    if (subdomain === "wholesale") {
      url.pathname = `/wholesale-portal${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    // admin subdomain or direct /admin/* path
    isAdminRequest = subdomain === "admin" || url.pathname.startsWith("/admin");
  }

  // ── Step 2: admin auth guard ──────────────────────────────────────
  if (isAdminRequest) {
    const pathname = url.pathname;
    const isAuthRoute =
      pathname === "/admin/login" ||
      pathname.startsWith("/admin/auth/") ||
      pathname.startsWith("/api/passkeys/");

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!isAuthRoute) {
      if (!user) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      if (!WHITELISTED_EMAILS.includes(user.email ?? "")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
      }
    }

    // Production admin subdomain: rewrite after auth passes
    if (!isLocal && host.split(".")[0] === "admin") {
      url.pathname = `/admin${url.pathname}`;
      const rewritten = NextResponse.rewrite(url, { request });
      supabaseResponse.cookies.getAll().forEach((c) =>
        rewritten.cookies.set(c.name, c.value)
      );
      return rewritten;
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
