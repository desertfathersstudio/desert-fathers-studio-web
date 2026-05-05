import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file             = form.get("file") as File | null;
    const sku              = ((form.get("sku") as string | null) ?? "unknown").trim().toLowerCase();
    const catalogFilename  = (form.get("catalogFilename") as string | null)?.trim() ?? "";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const raw = Buffer.from(await file.arrayBuffer());

    // If a catalog filename is provided, overwrite that exact R2 key so the D2C shop URL stays valid.
    // Otherwise fall back to a unique SKU-timestamped key.
    const key = catalogFilename
      ? `${catalogFilename.replace(/\.[^.]+$/, "")}.webp`
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
