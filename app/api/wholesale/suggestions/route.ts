import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";

export async function POST(req: NextRequest) {
  let body: {
    accountId: string;
    type: string;
    priority: string;
    relatedDesign: string;
    message: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { accountId, type, priority, relatedDesign, message } = body;
  if (!accountId || !ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const sb = createSupabaseService();
    const { error } = await sb.from("wholesale_suggestions").insert({
      account_id: accountId,
      type: type ?? "General Feedback",
      priority: priority ?? "Medium",
      related_design: relatedDesign || null,
      message: message.trim(),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wholesale/suggestions]", err);
    return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
  }
}
