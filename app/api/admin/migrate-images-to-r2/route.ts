/**
 * One-shot image migration: /public/stickers/ PNGs → Cloudflare R2 WebP.
 * Also updates products.image_url in the database.
 *
 * Protected by ADMIN_SECRET_KEY header.
 * Hit once after deploying:
 *   curl -H "x-admin-key: $ADMIN_SECRET_KEY" https://desertfathersstudio.com/api/admin/migrate-images-to-r2
 *
 * Idempotent — skips files already present in R2.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { uploadToR2, existsInR2, getPublicUrl, R2_PUBLIC_URL } from "@/lib/r2";

const STATIC_DIR = path.join(process.cwd(), "public/stickers");

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const log: string[] = [];
  let totalBefore = 0, totalAfter = 0, migrated = 0, skipped = 0, failed = 0;
  const r2UrlByBase = new Map<string, string>();

  // 1. Collect source files from /public/stickers/
  const localFiles = fs.existsSync(STATIC_DIR)
    ? fs.readdirSync(STATIC_DIR).filter(f => !f.startsWith("."))
    : [];

  log.push(`Found ${localFiles.length} files in /public/stickers/`);

  // 2. Also pull any Supabase Storage files not in static dir
  const seenNames = new Set(localFiles);
  const sbJobs: { name: string; size: number }[] = [];
  try {
    const { data: sbFiles } = await sb.storage.from("products").list("", { limit: 1000 });
    for (const f of sbFiles ?? []) {
      if (!seenNames.has(f.name)) {
        sbJobs.push({ name: f.name, size: f.metadata?.size ?? 0 });
        log.push(`Found in Supabase Storage only: ${f.name}`);
      }
    }
  } catch (e) {
    log.push(`Supabase Storage list failed: ${String(e)}`);
  }

  // 3. Process local files
  for (const filename of localFiles) {
    const filePath = path.join(STATIC_DIR, filename);
    const ext      = path.extname(filename).slice(1).toLowerCase();
    const base     = path.basename(filename, path.extname(filename));
    const r2Key    = `${base}.webp`;
    const sizeBefore = fs.statSync(filePath).size;

    try {
      if (await existsInR2(r2Key)) {
        r2UrlByBase.set(base.toLowerCase(), getPublicUrl(r2Key));
        log.push(`⏭  ${filename} → already in R2`);
        skipped++;
        totalBefore += sizeBefore;
        totalAfter  += sizeBefore;
        continue;
      }

      const srcBuf   = fs.readFileSync(filePath);
      const optimized = await sharp(srcBuf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const r2Url = await uploadToR2(optimized, r2Key, "image/webp");
      r2UrlByBase.set(base.toLowerCase(), r2Url);

      const pct = ((1 - optimized.length / sizeBefore) * 100).toFixed(0);
      log.push(`✓  ${filename} → ${r2Key}  (${(sizeBefore/1024).toFixed(0)}KB → ${(optimized.length/1024).toFixed(0)}KB, -${pct}%)`);
      migrated++;
      totalBefore += sizeBefore;
      totalAfter  += optimized.length;
    } catch (e) {
      log.push(`✗  ${filename} FAILED: ${String(e)}`);
      failed++;
    }
  }

  // 4. Process Supabase-only files
  for (const job of sbJobs) {
    const ext  = path.extname(job.name).slice(1).toLowerCase();
    const base = path.basename(job.name, path.extname(job.name));
    const r2Key = `${base}.webp`;
    try {
      if (await existsInR2(r2Key)) {
        r2UrlByBase.set(base.toLowerCase(), getPublicUrl(r2Key));
        skipped++; continue;
      }
      const { data, error } = await sb.storage.from("products").download(job.name);
      if (error || !data) throw new Error(error?.message ?? "download failed");
      const buf = Buffer.from(await data.arrayBuffer());
      const optimized = await sharp(buf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      const r2Url = await uploadToR2(optimized, r2Key, "image/webp");
      r2UrlByBase.set(base.toLowerCase(), r2Url);
      log.push(`✓  (supabase) ${job.name} → ${r2Key}`);
      migrated++;
    } catch (e) {
      log.push(`✗  (supabase) ${job.name} FAILED: ${String(e)}`);
      failed++;
    }
  }

  // 5. Update database image_url values
  const { data: products } = await sb
    .from("products")
    .select("id, image_url, sku")
    .not("image_url", "is", null);

  let dbUpdated = 0;
  for (const p of (products ?? []) as { id: string; image_url: string; sku: string }[]) {
    const url = p.image_url as string;
    let newUrl: string | null = null;

    if (url.startsWith("/stickers/")) {
      const name = decodeURIComponent(url.replace("/stickers/", ""));
      const base = path.basename(name, path.extname(name)).toLowerCase();
      newUrl = r2UrlByBase.get(base) ?? null;
    } else if (url.includes("supabase.co/storage")) {
      const rawName = decodeURIComponent(url.split("/").pop() ?? "");
      const base = path.basename(rawName, path.extname(rawName)).toLowerCase();
      newUrl = r2UrlByBase.get(base) ?? null;
    } else if (url.includes("r2.dev")) {
      continue; // already migrated
    }

    if (newUrl && newUrl !== url) {
      const { error } = await sb.from("products").update({ image_url: newUrl }).eq("id", p.id);
      if (error) {
        log.push(`  DB ✗ ${p.sku}: ${error.message}`);
      } else {
        log.push(`  DB ✓ ${p.sku}: ${newUrl}`);
        dbUpdated++;
      }
    }
  }

  return NextResponse.json({
    summary: {
      migrated,
      skipped,
      failed,
      dbUpdated,
      sizeBefore_MB: (totalBefore / 1024 / 1024).toFixed(1),
      sizeAfter_MB:  (totalAfter  / 1024 / 1024).toFixed(1),
      saved_pct: totalBefore > 0
        ? ((1 - totalAfter / totalBefore) * 100).toFixed(0) + "%"
        : "n/a",
    },
    log,
  });
}
