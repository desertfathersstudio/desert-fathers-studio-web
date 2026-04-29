import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "localhost";
  const rpID = host.split(":")[0];
  const sb = await createSupabaseServer();

  // Fetch all passkeys (discoverable — no user needed)
  const { data: passkeys } = await sb
    .from("admin_passkeys")
    .select("credential_id, user_id")
    .not("device_name", "eq", "__challenge__");

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification:    "preferred",
    allowCredentials:    (passkeys ?? []).map((p) => ({ id: p.credential_id })),
  });

  // Store challenge globally (keyed by rpID since we don't know the user yet)
  // We use a sentinel credential_id to store the current auth challenge
  await sb.from("admin_passkeys").upsert(
    {
      user_id:       (passkeys?.[0]?.user_id) ?? "00000000-0000-0000-0000-000000000000",
      credential_id: `auth-challenge-global`,
      public_key:    options.challenge,
      counter:       0,
      device_name:   "__auth_challenge__",
    },
    { onConflict: "credential_id" }
  );

  return NextResponse.json(options);
}
