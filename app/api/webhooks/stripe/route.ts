import { NextResponse } from "next/server";
import { after } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseService } from "@/lib/supabase/service";
import { logSalesTaxThresholdWarnings } from "@/lib/sales";
import { Resend } from "resend";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "missing");
}
const ADMIN_EMAIL = "jerome.maurice3@gmail.com";

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    after(() => handleSessionCompleted(session));
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    console.error("[stripe-webhook] Payment failed:", pi.id, pi.last_payment_error?.message);
  }

  return NextResponse.json({ received: true });
}

// ── Main handler ───────────────────────────────────────────────────────
async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[stripe-webhook] ▶ checkout.session.completed", session.id);

  if (session.payment_status !== "paid") {
    console.log("[stripe-webhook] Session not paid yet, skipping:", session.payment_status);
    return;
  }

  const supabase = createSupabaseService();

  // Deduplicate
  const { data: existing } = await supabase
    .from("retail_orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) {
    console.log("[stripe-webhook] Duplicate delivery — already processed", session.id);
    return;
  }

  // Retrieve full session with line_items expanded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  }) as any;

  const meta          = fullSession.metadata ?? {};
  const orderNumber   = `DFS-${session.id.replace(/^cs_(test_|live_)?/, "").slice(0, 8).toUpperCase()}`;
  const subtotalCents = parseInt(meta.subtotal_cents ?? "0", 10);
  const shippingCents = parseInt(meta.shipping_cents ?? "0", 10);
  const totalCents    = fullSession.amount_total ?? subtotalCents + shippingCents;

  // Names: Stripe's collected name takes priority, fall back to our metadata
  const metaName      = `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim();
  const customerName  = fullSession.shipping_details?.name ?? (metaName || "Customer");
  const customerEmail = fullSession.customer_details?.email ?? meta.email ?? "";
  const customerPhone = fullSession.customer_details?.phone ?? meta.phone ?? "";

  // Shipping address: prefer what Stripe collected, fall back to our metadata
  let shippingAddr: Record<string, unknown> = {};
  if (fullSession.shipping_details?.address) {
    shippingAddr = fullSession.shipping_details.address;
  } else {
    try { shippingAddr = JSON.parse(meta.shipping_address ?? "{}"); } catch { /* ignore */ }
  }

  // Parse items from metadata
  let parsedItems: Array<{ id: string; name: string; qty: number; unit: number }> = [];
  try { parsedItems = JSON.parse(meta.items ?? "[]"); } catch {
    console.warn("[stripe-webhook] Could not parse items metadata");
  }

  // ── Insert retail_order ───────────────────────────────────────────
  const { data: order, error: orderErr } = await supabase
    .from("retail_orders")
    .insert({
      stripe_session_id: session.id,
      stripe_pi_id:      typeof fullSession.payment_intent === "string"
        ? fullSession.payment_intent
        : fullSession.payment_intent?.id ?? null,
      order_number:      orderNumber,
      customer_name:     customerName,
      customer_email:    customerEmail,
      shipping_address:  shippingAddr,
      subtotal_cents:    subtotalCents,
      shipping_cents:    shippingCents,
      tax_cents:         0,
      total_cents:       totalCents,
      status:            "paid",
      stripe_metadata:   meta,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[stripe-webhook] Failed to insert retail_order:", orderErr);
    return;
  }

  // ── Insert line items ─────────────────────────────────────────────
  if (parsedItems.length > 0) {
    const lineItems = parsedItems.map((item) => ({
      order_id:         order.id,
      product_id:       item.id,
      product_name:     item.name,
      quantity:         item.qty,
      unit_price_cents: item.unit,
      line_total_cents: item.unit * item.qty,
    }));
    const { error: itemsErr } = await supabase.from("retail_order_items").insert(lineItems);
    if (itemsErr) console.error("[stripe-webhook] Failed to insert retail_order_items:", itemsErr);
  }

  // ── Upsert customer ───────────────────────────────────────────────
  if (customerEmail) {
    await upsertCustomer(supabase, {
      email:           customerEmail,
      firstName:       meta.first_name ?? customerName.split(" ")[0] ?? "",
      lastName:        meta.last_name  ?? customerName.split(" ").slice(1).join(" ") ?? "",
      phone:           customerPhone,
      shippingAddress: shippingAddr,
      orderTotalCents: totalCents,
      marketingOptIn:  meta.marketing_opt_in === "true",
    });
  }

  // ── Sales tax threshold check ─────────────────────────────────────
  await logSalesTaxThresholdWarnings(totalCents);

  console.log("[stripe-webhook] ✓ Order inserted:", order.id, orderNumber);

  // ── Send emails ───────────────────────────────────────────────────
  await sendEmails({
    orderNumber,
    customerName,
    customerEmail,
    items:           parsedItems,
    shippingAddress: shippingAddr,
    subtotalCents,
    shippingCents,
    totalCents,
  });
}

// ── Customer upsert ────────────────────────────────────────────────────
async function upsertCustomer(
  supabase: ReturnType<typeof createSupabaseService>,
  payload: {
    email:           string;
    firstName:       string;
    lastName:        string;
    phone:           string;
    shippingAddress: Record<string, unknown>;
    orderTotalCents: number;
    marketingOptIn:  boolean;
  }
) {
  const { email, firstName, lastName, phone, shippingAddress, orderTotalCents, marketingOptIn } = payload;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("customers")
    .select("order_count, total_spent_cents, first_purchase_at, phone, marketing_opt_in, marketing_opt_in_at")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // Only flip marketing_opt_in to true; never silently flip opted-in customers to false
    const newOptIn    = existing.marketing_opt_in || marketingOptIn;
    const newOptInAt  = !existing.marketing_opt_in && marketingOptIn
      ? now
      : existing.marketing_opt_in_at ?? null;

    await supabase
      .from("customers")
      .update({
        first_name:          firstName || undefined,
        last_name:           lastName  || undefined,
        phone:               phone     || existing.phone || null,
        shipping_address:    shippingAddress,
        order_count:         existing.order_count + 1,
        total_spent_cents:   existing.total_spent_cents + orderTotalCents,
        last_purchase_at:    now,
        marketing_opt_in:    newOptIn,
        marketing_opt_in_at: newOptInAt,
        updated_at:          now,
      })
      .eq("email", email);
  } else {
    await supabase.from("customers").insert({
      email,
      first_name:          firstName,
      last_name:           lastName,
      phone:               phone || null,
      shipping_address:    shippingAddress,
      order_count:         1,
      total_spent_cents:   orderTotalCents,
      first_purchase_at:   now,
      last_purchase_at:    now,
      marketing_opt_in:    marketingOptIn,
      marketing_opt_in_at: marketingOptIn ? now : null,
      source:              "retail",
    });
  }
}

// ── Email helpers ──────────────────────────────────────────────────────
function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildAddressLine(addr: Record<string, unknown>) {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code]
    .filter(Boolean)
    .join(", ");
}

interface EmailPayload {
  orderNumber:     string;
  customerName:    string;
  customerEmail:   string;
  items:           Array<{ id: string; name: string; qty: number; unit: number }>;
  shippingAddress: Record<string, unknown>;
  subtotalCents:   number;
  shippingCents:   number;
  totalCents:      number;
}

async function sendEmails(payload: EmailPayload) {
  const { orderNumber, customerName, customerEmail, items, shippingAddress, subtotalCents, shippingCents, totalCents } = payload;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "[stripe-webhook] ✗ RESEND_API_KEY is not set — skipping emails for order", orderNumber,
      "\n  → Add your Resend API key to .env.local (RESEND_API_KEY=re_...)"
    );
    return;
  }

  const from     = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const addrLine = buildAddressLine(shippingAddress);

  const itemsHtml = items
    .map((i) =>
      `<tr>
        <td style="padding:6px 0;">${i.name}</td>
        <td style="padding:6px 0;text-align:center;">×${i.qty}</td>
        <td style="padding:6px 0;text-align:right;">${formatCents(i.unit * i.qty)}</td>
      </tr>`
    )
    .join("");

  const summaryRows = `
    <tr><td>Subtotal</td><td style="text-align:right;">${formatCents(subtotalCents)}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right;">${shippingCents === 0 ? "Free" : formatCents(shippingCents)}</td></tr>
    <tr style="font-weight:bold;border-top:1px solid #e4d8c8;">
      <td style="padding-top:8px;">Total</td>
      <td style="padding-top:8px;text-align:right;">${formatCents(totalCents)}</td>
    </tr>`;

  const confirmationHtml = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#2a1a0e;">
      <h1 style="font-size:24px;color:#6B1F2A;margin-bottom:4px;">Thank you, ${customerName}!</h1>
      <p style="color:#7a6a5a;margin-top:0;">Order ${orderNumber} is confirmed. Your stickers are on their way.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">${itemsHtml}</table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${summaryRows}</table>
      <p style="margin-top:24px;font-size:14px;color:#7a6a5a;">
        <strong>Shipping to:</strong> ${addrLine}<br/>
        <strong>Estimated delivery:</strong> 3–7 business days
      </p>
      <hr style="border:none;border-top:1px solid #e4d8c8;margin:24px 0;" />
      <p style="font-size:12px;color:#7a6a5a;">Desert Fathers Studio · Coptic Orthodox sticker art</p>
    </div>`;

  const adminHtml = `
    <div style="font-family:monospace;font-size:13px;">
      <h2>New order: ${orderNumber}</h2>
      <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
      <p><strong>Ship to:</strong> ${addrLine}</p>
      <table>${itemsHtml}${summaryRows}</table>
    </div>`;

  const resend = getResend();

  console.log("[stripe-webhook] Sending emails — from:", from, "| customer:", customerEmail || "(none)", "| admin:", ADMIN_EMAIL);

  const [customerResult, adminResult] = await Promise.allSettled([
    customerEmail
      ? resend.emails.send({ from, to: customerEmail, subject: `Order confirmed — ${orderNumber}`, html: confirmationHtml })
      : Promise.resolve({ data: null, error: null }),
    resend.emails.send({ from, to: ADMIN_EMAIL, subject: `New order ${orderNumber} — ${formatCents(totalCents)}`, html: adminHtml }),
  ]);

  if (customerResult.status === "rejected") {
    console.error("[stripe-webhook] ✗ Customer email failed:", customerResult.reason);
  } else if (customerResult.value && "error" in customerResult.value && customerResult.value.error) {
    console.error("[stripe-webhook] ✗ Customer email Resend error:", customerResult.value.error);
  } else {
    console.log("[stripe-webhook] ✓ Customer email sent");
  }

  if (adminResult.status === "rejected") {
    console.error("[stripe-webhook] ✗ Admin email failed:", adminResult.reason);
  } else if (adminResult.value && "error" in adminResult.value && adminResult.value.error) {
    console.error("[stripe-webhook] ✗ Admin email Resend error:", adminResult.value.error);
  } else {
    console.log("[stripe-webhook] ✓ Admin email sent");
  }
}
