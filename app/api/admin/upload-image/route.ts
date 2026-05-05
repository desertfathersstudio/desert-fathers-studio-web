import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";
import { CATALOG } from "@/lib/catalog";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const sku  = ((form.get("sku") as string | null) ?? "unknown").trim().toLowerCase();
    const productName = ((form.get("name") as string | null) ?? "").trim();

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const raw = Buffer.from(await file.arrayBuffer());

    // Use canonical key if this product matches a catalog entry so stickerImageUrl() stays in sync
    const catalogEntry = productName ? CATALOG.find((s) => s.name === productName) : null;
    const key = catalogEntry
      ? `${catalogEntry.filename.replace(/\.[^.]+$/, "")}.webp`
      : `${sku}-${Date.now()}.webp`;

    const optimized = await sharp(raw)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const url = await uploadToR2(optimized, key, "image/webp");
    return NextResponse.json({ url });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
