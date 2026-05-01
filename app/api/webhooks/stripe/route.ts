import { NextResponse } from "next/server";
import { after } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseService } from "@/lib/supabase/service";
import { logSalesTaxThresholdWarnings } from "@/lib/sales";
import { Resend } from "resend";
import type Stripe from "stripe";

// Raw body required for Stripe signature verification — do not use bodyParser
export const dynamic = "force-dynamic";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "missing");
}
const ADMIN_EMAIL = "jerome.maurice3@gmail.com";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

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

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    after(() => handlePaymentSucceeded(pi));
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    console.error("[stripe-webhook] Payment failed:", pi.id, pi.last_payment_error?.message);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  console.log("[stripe-webhook] ▶ payment_intent.succeeded", pi.id);
  console.log("[stripe-webhook] metadata:", JSON.stringify(pi.metadata ?? {}));

  const supabase = createSupabaseService();

  // Check for duplicate webhook delivery
  const { data: existing } = await supabase
    .from("retail_orders")
    .select("id")
    .eq("stripe_pi_id", pi.id)
    .maybeSingle();

  if (existing) {
    console.log("[stripe-webhook] Duplicate delivery — already processed", pi.id);
    return;
  }

  const orderNumber = `DFS-${pi.id.replace("pi_", "").slice(0, 8).toUpperCase()}`;
  const subtotalCents = parseInt(pi.metadata?.subtotal_cents ?? "0", 10);
  const shippingCents = parseInt(pi.metadata?.shipping_cents ?? "0", 10);
  const taxCents = 0; // TAX DISABLED: re-enable once NC $1K nexus threshold is crossed
  const customerPhone = pi.metadata?.customer_phone ?? "";

  let parsedItems: Array<{
    id: string;
    name: string;
    qty: number;
    unit: number;
  }> = [];
  try {
    parsedItems = JSON.parse(pi.metadata?.items ?? "[]");
  } catch {
    console.warn("[stripe-webhook] Could not parse items metadata");
  }

  const shippingAddr = pi.shipping?.address ?? {};
  const customerName = pi.shipping?.name ?? pi.metadata?.customer_name ?? "Customer";
  const customerEmail = pi.receipt_email ?? pi.metadata?.customer_email ?? "";

  // Insert retail_order
  const { data: order, error: orderErr } = await supabase
    .from("retail_orders")
    .insert({
      stripe_pi_id: pi.id,
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddr,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: 0,
      total_cents: pi.amount,
      status: "paid",
      stripe_metadata: pi.metadata ?? {},
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[stripe-webhook] Failed to insert retail_order:", orderErr);
    return;
  }

  // Insert line items
  if (parsedItems.length > 0) {
    const lineItems = parsedItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.qty,
      unit_price_cents: item.unit,
      line_total_cents: item.unit * item.qty,
    }));

    const { error: itemsErr } = await supabase.from("retail_order_items").insert(lineItems);
    if (itemsErr) {
      console.error("[stripe-webhook] Failed to insert retail_order_items:", itemsErr);
    }
  }

  // Upsert client record for return requests and email campaigns
  if (customerEmail) {
    await upsertClient(supabase, {
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      shippingAddress: shippingAddr,
      orderTotalCents: pi.amount,
    });
  }

  // Check NC sales tax nexus thresholds ($900 warning, $1K required)
  await logSalesTaxThresholdWarnings(pi.amount);

  console.log("[stripe-webhook] ✓ Order inserted:", order.id, orderNumber);

  // Send emails (fire-and-forget inside after())
  await sendEmails({
    orderNumber,
    customerName,
    customerEmail,
    items: parsedItems,
    shippingAddress: shippingAddr,
    subtotalCents,
    shippingCents,
    totalCents: pi.amount,
  });
}

// ── Client upsert ─────────────────────────────────────────────────────
async function upsertClient(
  supabase: ReturnType<typeof createSupabaseService>,
  payload: {
    email: string;
    name: string;
    phone: string;
    shippingAddress: Partial<Stripe.Address>;
    orderTotalCents: number;
  }
) {
  const { email, name, phone, shippingAddress, orderTotalCents } = payload;
  const firstName = name.split(" ")[0] || name;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("clients")
    .select("order_count, total_spent_cents, first_order_at, phone")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("clients")
      .update({
        name,
        first_name: firstName,
        phone: phone || existing.phone || null,
        shipping_address: shippingAddress,
        order_count: existing.order_count + 1,
        total_spent_cents: existing.total_spent_cents + orderTotalCents,
        last_order_at: now,
        updated_at: now,
      })
      .eq("email", email);
  } else {
    await supabase.from("clients").insert({
      email,
      name,
      first_name: firstName,
      phone: phone || null,
      shipping_address: shippingAddress,
      order_count: 1,
      total_spent_cents: orderTotalCents,
      first_order_at: now,
      last_order_at: now,
    });
  }
}

interface EmailPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ id: string; name: string; qty: number; unit: number }>;
  shippingAddress: Partial<Stripe.Address>;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildAddressLine(addr: Partial<Stripe.Address>) {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code]
    .filter(Boolean)
    .join(", ");
}

async function sendEmails(payload: EmailPayload) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    items,
    shippingAddress,
    subtotalCents,
    shippingCents,
    totalCents,
  } = payload;

  // Guard: bail early with a clear log if the API key is missing
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "[stripe-webhook] ✗ RESEND_API_KEY is not set — skipping emails for order",
      orderNumber,
      "\n  → Add your Resend API key to .env.local (RESEND_API_KEY=re_...)",
      "\n  → For testing without a verified domain, use 'onboarding@resend.dev' as RESEND_FROM_EMAIL"
    );
    return;
  }

  // For Resend's free sandbox, emails can only be sent to the account owner's
  // email OR from a verified domain. If RESEND_FROM_EMAIL is unverified, Resend
  // will return a 403. Set it to 'onboarding@resend.dev' during testing.
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const addrLine = buildAddressLine(shippingAddress);

  const itemsHtml = items
    .map(
      (i) =>
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
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        ${itemsHtml}
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${summaryRows}
      </table>
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
      ? resend.emails.send({
          from,
          to: customerEmail,
          subject: `Order confirmed — ${orderNumber}`,
          html: confirmationHtml,
        })
      : Promise.resolve({ data: null, error: null }),
    resend.emails.send({
      from,
      to: ADMIN_EMAIL,
      subject: `New order ${orderNumber} — ${formatCents(totalCents)}`,
      html: adminHtml,
    }),
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
