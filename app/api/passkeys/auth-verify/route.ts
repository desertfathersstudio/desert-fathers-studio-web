import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createSupabaseService } from "@/lib/supabase/service";

function getOriginAndRpId(req: NextRequest) {
  const host  = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { origin: `${proto}://${host}`, rpID: host.split(":")[0] };
}

export async function POST(req: NextRequest) {
  const challenge = req.cookies.get("passkey_auth_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired — try again." }, { status: 400 });
  }

  const body = await req.json();
  const credentialId: string = body.credential?.id;
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  // Service role — user has no session yet, RLS would block reads
  const svc = createSupabaseService();

  const { data: passkey } = await svc
    .from("admin_passkeys")
    .select("*")
    .eq("credential_id", credentialId)
    .single();

  if (!passkey) {
    return NextResponse.json({ error: "Passkey not registered. Set up Face ID after signing in with your password first." }, { status: 404 });
  }

  let verification;
  try {
    const { origin, rpID } = getOriginAndRpId(req);
    verification = await verifyAuthenticationResponse({
      response:          body.credential,
      expectedChallenge: challenge,
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
  await svc.from("admin_passkeys")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", credentialId);

  // Generate a one-time sign-in link for the user via admin API
  const { data: userData } = await svc.auth.admin.getUserById(passkey.user_id);
  if (!userData?.user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const host  = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const redirectTo = `${proto}://${host}/admin/auth/callback`;

  const { data: linkData, error: linkErr } = await svc.auth.admin.generateLink({
    type:    "magiclink",
    email:   userData.user.email,
    options: { redirectTo },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkErr?.message ?? "Could not generate sign-in link" }, { status: 500 });
  }

  const res = NextResponse.json({ verified: true, actionLink: linkData.properties.action_link });
  res.cookies.set("passkey_auth_challenge", "", { maxAge: 0, path: "/" });
  return res;
}
