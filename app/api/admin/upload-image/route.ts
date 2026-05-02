import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const sku  = (form.get("sku") as string | null) ?? "unknown";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext  = file.name.split(".").pop() ?? "png";
    const path = `${sku.toLowerCase()}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const sb = createSupabaseService();
    const { error } = await sb.storage
      .from("products")
      .upload(path, bytes, { upsert: true, contentType: file.type });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = sb.storage.from("products").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
