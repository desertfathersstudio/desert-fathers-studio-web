import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const WHITELISTED_EMAILS = ["desertfathersstudio@gmail.com"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/inventory";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
  }

  if (!WHITELISTED_EMAILS.includes(data.user.email ?? "")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
