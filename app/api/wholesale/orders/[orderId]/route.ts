import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import type { OrderStage } from "@/types/wholesale";

type Params = { params: Promise<{ orderId: string }> };

const ADMIN_EMAIL = "desertfathersstudio@gmail.com";

export async function PATCH(req: NextRequest, { params }: Params) {
  const { orderId } = await params;

  // Two auth paths: wholesale user (accountId) or admin (adminKey header)
  const accountId = req.nextUrl.searchParams.get("accountId");
  const adminKey = req.headers.get("x-admin-key");
  const isAdmin = adminKey && adminKey === process.env.ADMIN_SECRET_KEY;

  if (!isAdmin && (!accountId || !ALL_ACCOUNT_IDS.has(accountId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  let shouldNotifyPaymentSent = false;

  if ("orderStage" in body) {
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    updates.order_stage = body.orderStage as OrderStage;
  }
  if ("trackingNumber" in body) {
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    updates.tracking_number = body.trackingNumber ?? null;
  }
  if ("paymentSent" in body) {
    updates.payment_sent = Boolean(body.paymentSent);
    updates.payment_sent_date = body.paymentSent
      ? (body.paymentSentDate ?? new Date().toISOString().slice(0, 10))
      : null;
    if (body.paymentSent) shouldNotifyPaymentSent = true;
  }
  if ("paymentReceived" in body) {
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    updates.payment_received = Boolean(body.paymentReceived);
    updates.payment_received_date = body.paymentReceived
      ? new Date().toISOString().slice(0, 10)
      : null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const sb = createSupabaseService();
    const query = sb
      .from("wholesale_orders")
      .update(updates)
      .eq("order_id", orderId);

    if (!isAdmin) query.eq("account_id", accountId!);

    const { error } = await query;
    if (error) throw error;

    if (shouldNotifyPaymentSent) {
      notifyPaymentSent(orderId, accountId ?? "").catch((e) =>
        console.error("[wholesale PATCH] payment notification failed:", e)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wholesale/orders PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

async function notifyPaymentSent(orderId: string, accountId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") return;
  const from = process.env.RESEND_FROM_EMAIL ?? "orders@desertfathersstudio.com";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [ADMIN_EMAIL],
      subject: `💸 Payment Sent — ${orderId}`,
      html: `<p style="font-family:sans-serif">Account <strong>${accountId}</strong> has marked payment as sent for order <strong>${orderId}</strong>.</p><p>Log in to the admin dashboard to confirm receipt.</p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
