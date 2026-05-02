import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

export async function POST(req: NextRequest) {
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId || !ALL_ACCOUNT_IDS.has(sessionAccountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
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

  const { type, priority, relatedDesign, message } = body;
  const accountId = sessionAccountId; // SECURITY: session-derived
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
