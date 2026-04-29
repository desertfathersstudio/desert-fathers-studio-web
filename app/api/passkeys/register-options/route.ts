import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const RP_NAME = "Desert Fathers Studio Admin";

function getRpId(req: NextRequest) {
  const host = req.headers.get("host") ?? "localhost";
  return host.split(":")[0]; // strip port
}

export async function GET(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch existing credential IDs to exclude
  const { data: existing } = await sb
    .from("admin_passkeys")
    .select("credential_id")
    .eq("user_id", user.id);

  const rpID = getRpId(req);

  const options = await generateRegistrationOptions({
    rpName:              RP_NAME,
    rpID,
    userName:            user.email ?? user.id,
    userDisplayName:     user.email ?? "Admin",
    attestationType:     "none",
    excludeCredentials:  (existing ?? []).map((c) => ({
      id: c.credential_id,
    })),
    authenticatorSelection: {
      residentKey:        "preferred",
      userVerification:   "preferred",
    },
  });

  // Store challenge in DB temporarily
  await sb.from("admin_passkeys").upsert(
    {
      user_id:     user.id,
      credential_id: `challenge-${user.id}`,
      public_key:  options.challenge,
      counter:     0,
      device_name: "__challenge__",
    },
    { onConflict: "credential_id" }
  );

  return NextResponse.json(options);
}
