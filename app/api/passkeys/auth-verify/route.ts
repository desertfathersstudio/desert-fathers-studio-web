import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createSupabaseServer } from "@/lib/supabase/server";

function getOriginAndRpId(req: NextRequest) {
  const host  = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { origin: `${proto}://${host}`, rpID: host.split(":")[0] };
}

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const body = await req.json();
  const credentialId: string = body.credential?.id;

  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  // Fetch the stored passkey by credential_id
  const { data: passkey } = await sb
    .from("admin_passkeys")
    .select("*")
    .eq("credential_id", credentialId)
    .single();

  if (!passkey) {
    return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
  }

  // Fetch the stored challenge
  const { data: challengeRow } = await sb
    .from("admin_passkeys")
    .select("public_key")
    .eq("credential_id", "auth-challenge-global")
    .single();

  if (!challengeRow) {
    return NextResponse.json({ error: "No challenge found" }, { status: 400 });
  }

  let verification;
  try {
    const { origin, rpID } = getOriginAndRpId(req);
    // In v13, credential.id is a Base64URL string; publicKey is Uint8Array
    verification = await verifyAuthenticationResponse({
      response:          body.credential,
      expectedChallenge: challengeRow.public_key,
      expectedOrigin:    origin,
      expectedRPID:      rpID,
      credential: {
        id:        passkey.credential_id,
        publicKey: isoBase64URL.toBuffer(passkey.public_key),
        counter:   passkey.counter,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
  }

  // Update counter
  await sb.from("admin_passkeys")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", credentialId);

  // Sign the user in via magic link exchange isn't possible server-side without a token.
  // Return the user_id; the client will call supabase.auth.signInWithOtp to get a session
  // by re-using the magic link flow, or we use a custom admin JWT approach.
  // For simplicity: return user_id and let the client proceed to /admin/inventory
  // after verifying (the user is already authenticated in a prior session via passkey gesture).
  // The recommended production flow is a custom JWT or service-role session exchange.
  return NextResponse.json({ verified: true, userId: passkey.user_id });
}
