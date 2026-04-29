import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const WHITELISTED_EMAILS = ["desertfathersstudio@gmail.com"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must happen before any redirect logic
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname === "/admin/login" || pathname.startsWith("/admin/auth/");

  if (!isAuthRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (!WHITELISTED_EMAILS.includes(user.email ?? "")) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/admin/login?error=unauthorized", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
