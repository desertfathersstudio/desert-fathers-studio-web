import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

// Returns per-product badge data for the pending tab.
// Shows when admin has replied so the reviewer knows to check back.
export async function GET(req: NextRequest) {
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = getAccountById(sessionAccountId);
  if (!account || !account.hasPendingTab) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("product_comments")
      .select("product_id, author_type, is_resolved");

    if (error) throw error;

    // Group by product: count admin comments and resolved items
    const map: Record<string, { adminCount: number; resolvedCount: number }> = {};
    for (const row of data ?? []) {
      const pid = row.product_id as string;
      if (!map[pid]) map[pid] = { adminCount: 0, resolvedCount: 0 };
      if (row.author_type === "admin") map[pid].adminCount++;
      if (row.is_resolved) map[pid].resolvedCount++;
    }

    const badges = Object.entries(map).map(([productId, counts]) => ({
      productId,
      adminCommentCount: counts.adminCount,
      hasResolution: counts.resolvedCount > 0,
    }));

    return NextResponse.json(badges);
  } catch (err) {
    console.error("[wholesale/comment-badges]", err);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}
