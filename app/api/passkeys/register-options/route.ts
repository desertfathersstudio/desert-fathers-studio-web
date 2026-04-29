import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseService } from "@/lib/supabase/service";

const RP_NAME = "Desert Fathers Studio Admin";

function getRpId(req: NextRequest) {
  return (req.headers.get("host") ?? "localhost").split(":")[0];
}

export async function GET(req: NextRequest) {
  // Must be logged in to register a passkey
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role to read existing passkeys (bypasses RLS)
  const svc = createSupabaseService();
  const { data: existing } = await svc
    .from("admin_passkeys")
    .select("credential_id")
    .eq("user_id", user.id);

  const options = await generateRegistrationOptions({
    rpName:  RP_NAME,
    rpID:    getRpId(req),
    userName:        user.email ?? user.id,
    userDisplayName: user.email ?? "Admin",
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });

  // Store challenge in HTTP-only cookie — no DB FK issues
  const res = NextResponse.json(options);
  res.cookies.set("passkey_reg_challenge", options.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return res;
}
