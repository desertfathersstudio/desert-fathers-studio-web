import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById } from "@/config/wholesale-accounts";

export async function POST(req: NextRequest) {
  let body: { accountId: string; productId: string; comment: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { accountId, productId, comment } = body;
  const account = getAccountById(accountId);
  if (!account || !account.hasPendingTab) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!comment?.trim()) {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  }

  try {
    const sb = createSupabaseService();
    const { data: product, error: fetchErr } = await sb
      .from("products")
      .select("id, review_comments")
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const entry = `[${timestamp}] ${comment.trim()}`;
    const existing = String(product.review_comments ?? "").trim();
    const updated = existing ? `${existing}\n${entry}` : entry;

    const { error: updateErr } = await sb
      .from("products")
      .update({ review_comments: updated })
      .eq("id", productId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ full: updated, entry });
  } catch (err) {
    console.error("[wholesale/comments]", err);
    return NextResponse.json({ error: "Failed to save comment" }, { status: 500 });
  }
}
