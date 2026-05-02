import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = getAccountById(sessionAccountId);
  if (!account || !account.hasPendingTab) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("product_comments")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[wholesale/product-comments]", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
