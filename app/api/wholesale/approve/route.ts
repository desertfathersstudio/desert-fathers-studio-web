import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

export async function POST(req: NextRequest) {
  // SECURITY: validate server-side session cookie
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { productId: string; action: "approve" | "unapprove" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { productId, action } = body;
  const account = getAccountById(sessionAccountId); // SECURITY: session, not client body
  if (!account || !account.hasPendingTab) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Approve → Coming Soon page (not straight to shop); unapprove → hide from Coming Soon too
  const update =
    action === "approve"
      ? { review_status: "approved" as const, coming_soon: true }
      : { review_status: "under_review" as const, coming_soon: false };

  try {
    const sb = createSupabaseService();
    const { error } = await sb
      .from("products")
      .update(update)
      .eq("id", productId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wholesale/approve]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
