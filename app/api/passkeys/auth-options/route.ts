import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createSupabaseService } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "localhost";
  const rpID = host.split(":")[0];

  // Service role — user is unauthenticated at this point, RLS would block without it
  const svc = createSupabaseService();
  const { data: passkeys } = await svc
    .from("admin_passkeys")
    .select("credential_id");

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: (passkeys ?? []).map((p) => ({ id: p.credential_id })),
  });

  // Store challenge in HTTP-only cookie — expires in 5 min
  const res = NextResponse.json(options);
  res.cookies.set("passkey_auth_challenge", options.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return res;
}
