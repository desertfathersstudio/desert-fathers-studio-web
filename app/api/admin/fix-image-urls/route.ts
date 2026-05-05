import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseService } from "@/lib/supabase/service";
import { CATALOG, stickerImageUrl } from "@/lib/catalog";
import { uploadToR2 } from "@/lib/r2";

const CATALOG_FILENAME_BY_NAME = new Map(CATALOG.map((s) => [s.name, s.filename]));

export async function POST() {
  const sb = createSupabaseService();

  const { data: products, error } = await sb
    .from("products")
    .select("id, name, image_url")
    .eq("active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const fixed: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const product of products ?? []) {
    const catalogFilename = CATALOG_FILENAME_BY_NAME.get(product.name as string);
    if (!catalogFilename) {
      skipped.push(product.name as string);
      continue;
    }

    const canonical = stickerImageUrl(catalogFilename);

    if ((product.image_url as string | null) === canonical) {
      skipped.push(product.name as string);
      continue;
    }

    try {
      // Fetch the current image (from timestamped R2 key, old Supabase URL, etc.)
      const currentUrl = product.image_url as string | null;
      if (!currentUrl) {
        errors.push(`${product.name}: no image_url to fetch from`);
        continue;
      }

      const imgRes = await fetch(currentUrl, { next: { revalidate: 0 } });
      if (!imgRes.ok) throw new Error(`Fetch failed ${imgRes.status}: ${currentUrl}`);

      const buf = Buffer.from(await imgRes.arrayBuffer());
      const optimized = await sharp(buf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const r2Key = `${catalogFilename.replace(/\.[^.]+$/, "")}.webp`;
      const newUrl = await uploadToR2(optimized, r2Key, "image/webp");

      const { error: updateErr } = await sb
        .from("products")
        .update({ image_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", product.id as string);

      if (updateErr) throw new Error(updateErr.message);

      fixed.push(product.name as string);
    } catch (err: unknown) {
      errors.push(`${product.name}: ${String(err)}`);
    }
  }

  return NextResponse.json({ fixed, skipped: skipped.length, errors });
}
