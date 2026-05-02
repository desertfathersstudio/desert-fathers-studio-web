import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

export async function GET(req: NextRequest) {
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId || !ALL_ACCOUNT_IDS.has(sessionAccountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("products")
      .select("updated_at")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const lastModified = data?.updated_at ?? new Date().toISOString();
    return NextResponse.json({ lastModified });
  } catch (err) {
    console.error("[wholesale/last-modified]", err);
    return NextResponse.json({ lastModified: new Date().toISOString() });
  }
}
