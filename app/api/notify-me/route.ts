import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  let body: { productName?: string; email?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const productName = typeof body.productName === "string" ? body.productName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!productName || !email) {
    return NextResponse.json({ error: "Product name and email are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const sb = createSupabaseService();
  const { error } = await sb
    .from("notify_requests")
    .upsert({ product_name: productName, email }, { onConflict: "product_name,email" });

  if (error) {
    console.error("[notify-me]", error.message);
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
