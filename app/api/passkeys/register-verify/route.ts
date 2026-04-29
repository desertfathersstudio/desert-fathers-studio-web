import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createSupabaseServer } from "@/lib/supabase/server";

function getOriginAndRpId(req: NextRequest) {
  const host  = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { origin: `${proto}://${host}`, rpID: host.split(":")[0] };
}

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const deviceName: string = body.deviceName ?? "Passkey";

  // Fetch stored challenge
  const { data: challengeRow } = await sb
    .from("admin_passkeys")
    .select("public_key")
    .eq("credential_id", `challenge-${user.id}`)
    .single();

  if (!challengeRow) {
    return NextResponse.json({ error: "No challenge found. Start registration again." }, { status: 400 });
  }

  const { origin, rpID } = getOriginAndRpId(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response:           body.credential,
      expectedChallenge:  challengeRow.public_key,
      expectedOrigin:     origin,
      expectedRPID:       rpID,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  // In v13, credential.id is already a Base64URL string; publicKey is Uint8Array
  const { error } = await sb.from("admin_passkeys").upsert(
    {
      user_id:       user.id,
      credential_id: credential.id,
      public_key:    isoBase64URL.fromBuffer(credential.publicKey),
      counter:       credential.counter,
      device_name:   deviceName,
    },
    { onConflict: "credential_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up challenge placeholder
  await sb.from("admin_passkeys")
    .delete()
    .eq("credential_id", `challenge-${user.id}`);

  return NextResponse.json({ verified: true });
}
