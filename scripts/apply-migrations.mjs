/**
 * Applies all SQL migrations to the Supabase database.
 * Requires DB_PASSWORD env var — get it from:
 * Supabase Dashboard → Settings → Database → Database password
 *
 * Usage:
 *   DB_PASSWORD=<your-password> node scripts/apply-migrations.mjs
 */

import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = "wzzdynhsjiskqfpwghdn";
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error("❌  DB_PASSWORD env var is required.");
  console.error("   Get it from: Supabase Dashboard → Settings → Database → Database password");
  console.error("   Then run:  DB_PASSWORD=<password> node scripts/apply-migrations.mjs");
  process.exit(1);
}

const client = new Client({
  host:     `db.${PROJECT_REF}.supabase.co`,
  port:     5432,
  database: "postgres",
  user:     "postgres",
  password: DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
});

const MIGRATIONS = [
  "001_admin_passkeys.sql",
  "002_rls_policies.sql",
  "003_rpc_deliver_order.sql",
  "004_rpc_log_giveaway.sql",
  "005_misc_expenses.sql",
  "006_fix_rpc_generated_status.sql",
  "007_incoming_rpc_and_backfill.sql",
];

await client.connect();
console.log("✓ Connected to Supabase database");

for (const file of MIGRATIONS) {
  const sql = readFileSync(join(__dirname, `../supabase/migrations/${file}`), "utf8");
  try {
    await client.query(sql);
    console.log(`✓ Applied ${file}`);
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log(`⚠  ${file} — skipped (already applied)`);
    } else {
      console.error(`❌  ${file} failed:`, err.message);
    }
  }
}

await client.end();
console.log("\n✅ All migrations complete.");
