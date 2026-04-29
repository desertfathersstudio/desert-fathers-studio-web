/**
 * Creates or updates the admin user with email+password auth.
 * Run once:  node scripts/setup-admin-password.mjs
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAIL    = "desertfathersstudio@gmail.com";
const PASSWORD = "Dfssales2026";

const { data: { users }, error: listErr } = await sb.auth.admin.listUsers();
if (listErr) { console.error("❌ list users:", listErr.message); process.exit(1); }

const existing = users.find((u) => u.email === EMAIL);

if (existing) {
  const { error } = await sb.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) { console.error("❌ update:", error.message); process.exit(1); }
  console.log("✅ Password updated for", EMAIL);
} else {
  const { error } = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) { console.error("❌ create:", error.message); process.exit(1); }
  console.log("✅ User created:", EMAIL);
}
