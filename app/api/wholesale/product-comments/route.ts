import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById } from "@/config/wholesale-accounts";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  const accountId = req.nextUrl.searchParams.get("accountId");

  const account = getAccountById(accountId ?? "");
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
