import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

export async function POST(req: NextRequest) {
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { productId: string; comment: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { productId, comment } = body;
  const account = getAccountById(sessionAccountId); // SECURITY: session, not body
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

    // Update legacy text field (backwards compat)
    const { error: updateErr } = await sb
      .from("products")
      .update({ review_comments: updated })
      .eq("id", productId);

    if (updateErr) throw updateErr;

    // Write to structured comments table
    await sb.from("product_comments").insert({
      product_id: productId,
      body: comment.trim(),
      author: account.displayName,
      author_type: "reviewer",
    });

    return NextResponse.json({ full: updated, entry });
  } catch (err) {
    console.error("[wholesale/comments]", err);
    return NextResponse.json({ error: "Failed to save comment" }, { status: 500 });
  }
}
