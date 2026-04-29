import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseService } from "@/lib/supabase/service";

function getOriginAndRpId(req: NextRequest) {
  const host  = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { origin: `${proto}://${host}`, rpID: host.split(":")[0] };
}

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const challenge = req.cookies.get("passkey_reg_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired — start registration again." }, { status: 400 });
  }

  const body = await req.json();
  const deviceName: string = body.deviceName ?? "Passkey";
  const { origin, rpID } = getOriginAndRpId(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response:          body.credential,
      expectedChallenge: challenge,
      expectedOrigin:    origin,
      expectedRPID:      rpID,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  // Use service role to write passkey (guarantees write regardless of session state)
  const svc = createSupabaseService();
  const { error } = await svc.from("admin_passkeys").upsert(
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

  const res = NextResponse.json({ verified: true });
  // Clear the registration challenge cookie
  res.cookies.set("passkey_reg_challenge", "", { maxAge: 0, path: "/" });
  return res;
}
