/**
 * Migrate sticker images → Cloudflare R2
 *
 * Usage:
 *   npx tsx scripts/migrate-to-r2.ts            # live run
 *   npx tsx scripts/migrate-to-r2.ts --dry-run  # preview only
 *
 * Reads credentials from .env.local (falling back to .env.production.local).
 * Required vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *                R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ── Env loading ───────────────────────────────────────────────────────────────
// Parse manually to avoid dotenvx interception swapping values to empty strings.
function loadEnv(filePath: string, override = false) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (val && (override || !process.env[key])) process.env[key] = val;
  }
}

loadEnv(path.join(ROOT, ".env.local"), true);
loadEnv(path.join(ROOT, ".env.production.local"));

// ── Validate env ──────────────────────────────────────────────────────────────
const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SERVICE_KEY:  process.env.SUPABASE_SERVICE_ROLE_KEY,
  ACCOUNT_ID:   process.env.R2_ACCOUNT_ID,
  ACCESS_KEY:   process.env.R2_ACCESS_KEY_ID,
  SECRET_KEY:   process.env.R2_SECRET_ACCESS_KEY,
  BUCKET:       process.env.R2_BUCKET_NAME,
  R2_PUBLIC:    (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, ""),
};

const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`\nMissing env vars: ${missing.join(", ")}`);
  console.error("Add them to .env.local and try again.\n");
  process.exit(1);
}

const DRY_RUN    = process.argv.includes("--dry-run");
const STATIC_DIR = path.join(ROOT, "public/stickers");

// ── Clients ───────────────────────────────────────────────────────────────────
const sb = createClient(env.SUPABASE_URL!, env.SERVICE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const r2 = new S3Client({
  region:   "auto",
  endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.ACCESS_KEY!, secretAccessKey: env.SECRET_KEY! },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function r2Url(key: string) {
  return `${env.R2_PUBLIC}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: env.BUCKET!, Key: key }));
    return true;
  } catch { return false; }
}

async function uploadToR2(buf: Buffer, key: string): Promise<void> {
  await r2.send(new PutObjectCommand({ Bucket: env.BUCKET!, Key: key, Body: buf, ContentType: "image/webp" }));
}

async function toWebp(buf: Buffer, sizeBefore: number, ext: string): Promise<Buffer> {
  const shouldConvert = sizeBefore > 300 * 1024 || ext !== "webp";
  return sharp(buf)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: shouldConvert ? 85 : 90 })
    .toBuffer();
}

// ── Build job list ────────────────────────────────────────────────────────────
interface Job {
  name: string;
  size: number;
  getBuffer: () => Promise<Buffer>;
  source: "local" | "supabase";
}

async function buildJobs(): Promise<Job[]> {
  const jobs: Job[] = [];
  const seen = new Set<string>();

  // Local files from /public/stickers/
  if (fs.existsSync(STATIC_DIR)) {
    for (const f of fs.readdirSync(STATIC_DIR).filter(n => !n.startsWith("."))) {
      const full = path.join(STATIC_DIR, f);
      jobs.push({ name: f, size: fs.statSync(full).size, source: "local",
        getBuffer: async () => fs.readFileSync(full) });
      seen.add(f);
    }
  }

  // Supabase Storage — any files not in local dir
  const { data: sbFiles, error } = await sb.storage.from("products").list("", { limit: 1000 });
  if (error) {
    console.warn(`  ⚠  Supabase Storage list failed: ${error.message} (skipping)`);
  } else {
    for (const f of sbFiles ?? []) {
      if (seen.has(f.name)) continue;
      jobs.push({
        name: f.name, size: f.metadata?.size ?? 0, source: "supabase",
        getBuffer: async () => {
          const { data, error: dlErr } = await sb.storage.from("products").download(f.name);
          if (dlErr || !data) throw new Error(dlErr?.message ?? "download failed");
          return Buffer.from(await data.arrayBuffer());
        },
      });
    }
  }
  return jobs;
}

// ── DB update ─────────────────────────────────────────────────────────────────
async function updateDbUrl(base: string, newUrl: string): Promise<number> {
  // Find all products whose image_url references this base name
  const { data: products } = await sb
    .from("products")
    .select("id, image_url, sku")
    .not("image_url", "is", null);

  let updated = 0;
  for (const p of (products ?? []) as { id: string; image_url: string; sku: string }[]) {
    const url = p.image_url;
    if (url.includes("r2.dev")) continue; // already R2

    let matches = false;
    if (url.startsWith("/stickers/")) {
      const urlBase = path.basename(decodeURIComponent(url.replace("/stickers/", "")), path.extname(url)).toLowerCase();
      matches = urlBase === base;
    } else if (url.includes("supabase.co/storage")) {
      const urlBase = path.basename(decodeURIComponent(url.split("/").pop() ?? ""), path.extname(url)).toLowerCase();
      matches = urlBase === base;
    }

    if (matches) {
      if (!DRY_RUN) {
        const { error } = await sb.from("products").update({ image_url: newUrl }).eq("id", p.id);
        if (error) { console.log(`    DB ✗ ${p.sku}: ${error.message}`); continue; }
      }
      console.log(`    DB ${DRY_RUN ? "(dry)" : "✓"} ${p.sku} → ${newUrl.slice(-40)}`);
      updated++;
    }
  }
  return updated;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Sticker Image Migration → Cloudflare R2`);
  console.log(`  Mode  : ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`  Bucket: ${env.BUCKET}`);
  console.log(`${"═".repeat(60)}\n`);

  console.log("Building job list...");
  const jobs = await buildJobs();
  console.log(`Found ${jobs.length} files (${jobs.filter(j => j.source === "local").length} local, ${jobs.filter(j => j.source === "supabase").length} Supabase-only)\n`);
  console.log(`${"─".repeat(60)}`);

  let migrated = 0, skipped = 0, failed = 0, dbUpdated = 0;
  let totalBefore = 0, totalAfter = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const prefix = `[${String(i + 1).padStart(3)}/${jobs.length}]`;
    const label = job.name.length > 45 ? job.name.slice(0, 42) + "..." : job.name;
    process.stdout.write(`${prefix} ${label.padEnd(47)}`);

    const ext  = path.extname(job.name).slice(1).toLowerCase();
    const base = path.basename(job.name, path.extname(job.name));
    const r2Key = `${base}.webp`;

    try {
      if (await existsInR2(r2Key)) {
        process.stdout.write(`⏭  already in R2\n`);
        skipped++;
        totalBefore += job.size;
        totalAfter  += job.size;
        continue;
      }

      const raw      = await job.getBuffer();
      const optimized = await toWebp(raw, job.size, ext);
      const url       = r2Url(r2Key);

      if (!DRY_RUN) await uploadToR2(optimized, r2Key);

      const pct = job.size > 0 ? ((1 - optimized.length / job.size) * 100).toFixed(0) : "0";
      process.stdout.write(
        `✓  ${(job.size / 1024).toFixed(0).padStart(5)}KB → ${(optimized.length / 1024).toFixed(0).padStart(4)}KB  (-${pct}%)\n`
      );
      migrated++;
      totalBefore += job.size;
      totalAfter  += optimized.length;

      // Update DB immediately after successful upload
      const n = await updateDbUrl(base.toLowerCase(), url);
      dbUpdated += n;

    } catch (e: unknown) {
      process.stdout.write(`✗  FAILED: ${e instanceof Error ? e.message : String(e)}\n`);
      failed++;
    }
  }

  const savedMB  = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(1);
  const savedPct = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(0) : "0";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Migrated  : ${migrated}`);
  console.log(`  Skipped   : ${skipped} (already in R2)`);
  console.log(`  Failed    : ${failed}`);
  console.log(`  DB rows   : ${dbUpdated} updated`);
  console.log(`  Size      : ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB  (saved ${savedMB} MB / ${savedPct}%)`);
  if (DRY_RUN) console.log(`\n  ⚠  DRY RUN — nothing written to R2 or the database`);
  console.log(`${"═".repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
