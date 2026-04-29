import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import type { OrderStage } from "@/types/wholesale";

type Params = { params: Promise<{ orderId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { orderId } = await params;
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId || !ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if ("orderStage" in body) {
    updates.order_stage = body.orderStage as OrderStage;
  }
  if ("trackingNumber" in body) {
    updates.tracking_number = body.trackingNumber ?? null;
  }
  if ("paymentSent" in body) {
    updates.payment_sent = Boolean(body.paymentSent);
    updates.payment_sent_date = body.paymentSent
      ? (body.paymentSentDate ?? new Date().toISOString().slice(0, 10))
      : null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const sb = createSupabaseService();
    const { error } = await sb
      .from("wholesale_orders")
      .update(updates)
      .eq("order_id", orderId)
      .eq("account_id", accountId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wholesale/orders PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
