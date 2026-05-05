import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const sku  = ((form.get("sku") as string | null) ?? "unknown").trim().toLowerCase();

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const raw = Buffer.from(await file.arrayBuffer());
    const key = `${sku}-${Date.now()}.webp`;

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
