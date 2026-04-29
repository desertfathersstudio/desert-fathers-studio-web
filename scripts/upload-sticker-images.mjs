/**
 * Uploads all sticker PNGs from public/stickers/ to Supabase Storage
 * and updates image_url in the products table.
 *
 * Usage: node scripts/upload-sticker-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STICKERS_DIR = join(__dirname, "../public/stickers");
const BUCKET = "products";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Normalize a string for fuzzy comparison
function normalize(s) {
  return s
    .toLowerCase()
    .replace(/\d+\s*-\s*/, "")   // strip leading "01 - " number prefix
    .replace(/\.(png|jpg|jpeg)$/i, "")
    .replace(/[_()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple token overlap score (0–1)
function score(a, b) {
  const ta = new Set(normalize(a).split(" ").filter(Boolean));
  const tb = new Set(normalize(b).split(" ").filter(Boolean));
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.max(ta.size, tb.size, 1);
}

// Fetch all products
const { data: products, error: pErr } = await sb.from("products").select("id, name, sku, image_url");
if (pErr) { console.error("❌ fetch products:", pErr.message); process.exit(1); }
console.log(`✓ Fetched ${products.length} products from DB`);

// Ensure bucket exists (creates if missing — won't error if already there)
await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

const files = readdirSync(STICKERS_DIR).filter((f) => /\.png$/i.test(f));
console.log(`✓ Found ${files.length} PNG files\n`);

let uploaded = 0;
let matched  = 0;
let skipped  = 0;

for (const file of files) {
  const filePath = join(STICKERS_DIR, file);
  const fileData = readFileSync(filePath);
  const storagePath = `stickers/${file}`;

  // Upload (upsert)
  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, fileData, { contentType: "image/png", upsert: true });

  if (upErr) {
    console.error(`  ❌ upload ${file}: ${upErr.message}`);
    continue;
  }

  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
  uploaded++;

  // Find best matching product
  let best = null;
  let bestScore = 0;
  for (const p of products) {
    const s = score(file, p.name);
    if (s > bestScore) { bestScore = s; best = p; }
  }

  if (!best || bestScore < 0.3) {
    console.log(`  ⚠  No match for: ${file} (best score ${bestScore.toFixed(2)})`);
    skipped++;
    continue;
  }

  // Update image_url
  const { error: uErr } = await sb
    .from("products")
    .update({ image_url: publicUrl })
    .eq("id", best.id);

  if (uErr) {
    console.error(`  ❌ update ${best.name}: ${uErr.message}`);
  } else {
    console.log(`  ✓ ${file.padEnd(55)} → ${best.name}`);
    matched++;
  }
}

console.log(`\n✅ Done: ${uploaded} uploaded, ${matched} matched, ${skipped} unmatched`);
