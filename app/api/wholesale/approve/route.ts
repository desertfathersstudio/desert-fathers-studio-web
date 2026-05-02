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

  const newStatus = action === "approve" ? "approved" : "under_review";

  try {
    const sb = createSupabaseService();
    const { error } = await sb
      .from("products")
      .update({ review_status: newStatus })
      .eq("id", productId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wholesale/approve]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
