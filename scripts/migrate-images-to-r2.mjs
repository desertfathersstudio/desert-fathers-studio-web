/**
 * migrate-images-to-r2.mjs
 *
 * Migrates sticker images from /public/stickers/ (and Supabase Storage backup)
 * to Cloudflare R2. Optimizes every file to WebP via sharp. Updates database
 * image_url values to point to R2 public URLs.
 *
 * Usage:
 *   node scripts/migrate-images-to-r2.mjs            # live run
 *   node scripts/migrate-images-to-r2.mjs --dry-run  # preview only
 *
 * Requires .env.local (or Vercel env vars pulled locally via `vercel env pull`).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manually parse and inject env files — dotenvx intercepts config() calls
// so we read + inject directly into process.env to guarantee precedence.
function loadEnvFile(filePath, override = false) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val && (override || !process.env[key])) {
      process.env[key] = val;
    }
  }
}

// All required vars (R2 + Supabase) live in .env.production.local (pulled via vercel env pull)
loadEnvFile(path.join(__dirname, "../.env.production.local"), true);

// ── Env vars ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCOUNT_ID   = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY   = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY   = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET       = process.env.R2_BUCKET_NAME;
const R2_PUBLIC    = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_KEY, ACCOUNT_ID, ACCESS_KEY, SECRET_KEY, BUCKET, R2_PUBLIC })) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const DRY_RUN   = process.argv.includes("--dry-run");
const STATIC_DIR = path.join(__dirname, "../public/stickers");

// ── Clients ───────────────────────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const r2 = new S3Client({
  region:   "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function r2PublicUrl(key) {
  return `${R2_PUBLIC}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function optimize(buffer, sizeBefore, originalExt) {
  const shouldConvert = sizeBefore > 300 * 1024 || originalExt.toLowerCase() !== "webp";
  if (shouldConvert) {
    const data = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    return { buffer: data, contentType: "image/webp", newExt: "webp" };
  }
  const data = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .toBuffer();
  return { buffer: data, contentType: "image/webp", newExt: "webp" };
}

async function processFile(originalName, getBuffer, sizeBefore) {
  const ext  = path.extname(originalName).slice(1).toLowerCase();
  const base = path.basename(originalName, path.extname(originalName));
  const r2Key = `${base}.webp`;

  const alreadyExists = await existsInR2(r2Key);
  if (alreadyExists) {
    return { r2Key, r2Url: r2PublicUrl(r2Key), sizeBefore, sizeAfter: null, skipped: true };
  }

  const buf = await getBuffer();
  const { buffer: optimized, contentType } = await optimize(buf, sizeBefore, ext);

  if (!DRY_RUN) {
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET, Key: r2Key, Body: optimized, ContentType: contentType,
    }));
  }

  return { r2Key, r2Url: r2PublicUrl(r2Key), sizeBefore, sizeAfter: optimized.length, skipped: false };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${"═".repeat(64)}`);
  console.log(`  Sticker Image Migration → Cloudflare R2`);
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`  Bucket: ${BUCKET}`);
  console.log(`${"═".repeat(64)}\n`);

  // 1. Collect jobs — local static files first
  const seenNames = new Set();
  const jobs = [];

  const localFiles = fs.readdirSync(STATIC_DIR).filter(f => !f.startsWith("."));
  for (const f of localFiles) {
    const fullPath = path.join(STATIC_DIR, f);
    const size = fs.statSync(fullPath).size;
    jobs.push({ name: f, getBuffer: async () => fs.readFileSync(fullPath), size });
    seenNames.add(f);
  }

  // 2. Also check Supabase Storage for any new uploads not in static dir
  console.log("Listing Supabase Storage bucket...");
  const { data: sbFiles, error: sbErr } = await sb.storage.from("products").list("", { limit: 1000 });
  if (sbErr) {
    console.warn(`  Could not list Supabase Storage: ${sbErr.message} (continuing with local files only)`);
  } else {
    for (const f of sbFiles ?? []) {
      if (seenNames.has(f.name)) continue;
      jobs.push({
        name: f.name,
        size: f.metadata?.size ?? 0,
        getBuffer: async () => {
          const { data, error } = await sb.storage.from("products").download(f.name);
          if (error || !data) throw new Error(`Supabase download failed: ${error?.message}`);
          return Buffer.from(await data.arrayBuffer());
        },
      });
      console.log(`  + Found in Supabase Storage only: ${f.name}`);
    }
  }

  console.log(`\nTotal files to process: ${jobs.length}\n${"─".repeat(64)}`);

  // 3. Process each file
  let totalBefore = 0, totalAfter = 0, migratedCount = 0, skippedCount = 0, failedCount = 0;
  const r2UrlByBase = new Map(); // base-name-no-ext → r2Url

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const prefix = `[${String(i + 1).padStart(3)}/${jobs.length}]`;
    process.stdout.write(`${prefix} ${job.name.slice(0, 50).padEnd(52)}`);

    try {
      const result = await processFile(job.name, job.getBuffer, job.size);
      const base = path.basename(job.name, path.extname(job.name));
      r2UrlByBase.set(base.toLowerCase(), result.r2Url);

      if (result.skipped) {
        process.stdout.write(`⏭  already in R2\n`);
        skippedCount++;
        totalBefore += job.size;
        totalAfter  += job.size;
      } else {
        const pct = result.sizeBefore > 0
          ? ((1 - result.sizeAfter / result.sizeBefore) * 100).toFixed(0)
          : "0";
        process.stdout.write(
          `✓  ${(result.sizeBefore / 1024).toFixed(0).padStart(5)}KB → ${(result.sizeAfter / 1024).toFixed(0).padStart(4)}KB  (-${pct}%)\n`
        );
        migratedCount++;
        totalBefore += result.sizeBefore;
        totalAfter  += result.sizeAfter;
      }
    } catch (e) {
      process.stdout.write(`✗  FAILED: ${e.message}\n`);
      failedCount++;
    }
  }

  // 4. Update database image_url values
  console.log(`\n${"─".repeat(64)}\nUpdating database image_url values...`);

  const { data: products, error: fetchErr } = await sb
    .from("products")
    .select("id, image_url, sku")
    .not("image_url", "is", null);

  if (fetchErr) {
    console.error("Failed to fetch products:", fetchErr.message);
  } else {
    let dbUpdated = 0;
    for (const p of products ?? []) {
      const url = p.image_url;
      let newUrl = null;

      // Relative /stickers/filename.ext
      if (url.startsWith("/stickers/")) {
        const name = decodeURIComponent(url.replace("/stickers/", ""));
        const base = path.basename(name, path.extname(name)).toLowerCase();
        newUrl = r2UrlByBase.get(base) ?? null;
      }
      // Full Supabase Storage URL
      else if (url.includes("supabase.co/storage")) {
        const rawName = decodeURIComponent(url.split("/").pop() ?? "");
        const base = path.basename(rawName, path.extname(rawName)).toLowerCase();
        newUrl = r2UrlByBase.get(base) ?? null;
      }
      // Already an R2 URL — skip
      else if (url.includes("r2.dev")) {
        continue;
      }

      if (newUrl && newUrl !== url) {
        if (!DRY_RUN) {
          const { error } = await sb.from("products").update({ image_url: newUrl }).eq("id", p.id);
          if (error) { console.log(`  ✗ DB update failed for ${p.sku}: ${error.message}`); continue; }
        }
        const display = (s) => s.length > 55 ? s.slice(0, 52) + "..." : s;
        console.log(`  ${DRY_RUN ? "(dry)" : "✓"} ${p.sku}: ${display(url)} → ${display(newUrl)}`);
        dbUpdated++;
      }
    }
    console.log(`\nDB rows updated: ${dbUpdated}`);
  }

  // 5. Summary
  const savedMB   = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(1);
  const savedPct  = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(0) : 0;
  console.log(`\n${"═".repeat(64)}`);
  console.log(`  Files migrated : ${migratedCount}`);
  console.log(`  Files skipped  : ${skippedCount} (already in R2)`);
  console.log(`  Files failed   : ${failedCount}`);
  console.log(`  Size before    : ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Size after     : ${(totalAfter  / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Saved          : ${savedMB} MB (${savedPct}%)`);
  if (DRY_RUN) console.log(`\n  ⚠  DRY RUN — nothing was written to R2 or the database`);
  console.log(`${"═".repeat(64)}\n`);

  if (failedCount > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
