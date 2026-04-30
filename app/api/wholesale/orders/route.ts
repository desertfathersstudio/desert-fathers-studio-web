import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import { generateOrderPdf } from "@/lib/wholesale/generate-order-pdf";
import type { WholesaleOrder, WholesaleOrderItem, OrderStage } from "@/types/wholesale";

const ADMIN_EMAIL = "desertfathersstudio@gmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://desertfathersstudio.com";

async function nextOrderNumber(sb: ReturnType<typeof createSupabaseService>): Promise<string> {
  const { count } = await sb
    .from("wholesale_orders")
    .select("*", { count: "exact", head: true });
  const n = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `WS-${n}`;
}

function absoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url}`;
}

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId || !ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("wholesale_orders")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const orders: WholesaleOrder[] = (data ?? []).map((row) => ({
      id: String(row.id),
      orderId: String(row.order_id),
      accountId: String(row.account_id),
      customerName: String(row.customer_name),
      customerEmail: String(row.customer_email),
      items: (row.items as WholesaleOrderItem[]) ?? [],
      grandTotal: Number(row.grand_total),
      asap: Boolean(row.asap),
      orderStage: (row.order_stage as OrderStage) ?? "Pending",
      trackingNumber: row.tracking_number as string | null,
      paymentSent: Boolean(row.payment_sent),
      paymentSentDate: row.payment_sent_date as string | null,
      paymentReceived: Boolean(row.payment_received),
      paymentReceivedDate: row.payment_received_date as string | null,
      createdAt: String(row.created_at),
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[wholesale/orders GET]", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { accountId, customerName, customerEmail, items, grandTotal, asap } = body as {
    accountId: string; customerName: string; customerEmail: string;
    items: WholesaleOrderItem[]; grandTotal: number; asap: boolean;
  };

  if (!accountId || !ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  try {
    const sb = createSupabaseService();
    const orderId = await nextOrderNumber(sb);

    const { error } = await sb.from("wholesale_orders").insert({
      order_id: orderId,
      account_id: accountId,
      customer_name: customerName,
      customer_email: customerEmail,
      items,
      grand_total: grandTotal,
      asap: Boolean(asap),
      order_stage: "Pending",
    });
    if (error) throw error;

    // Fire-and-forget — customer gets the response immediately
    sendOrderEmail({ orderId, customerName, customerEmail, items, grandTotal, asap })
      .catch((e) => console.error("[wholesale/orders] email failed:", e));

    return NextResponse.json({ orderId });
  } catch (err) {
    console.error("[wholesale/orders POST]", err);
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}

async function sendOrderEmail(opts: {
  orderId: string; customerName: string; customerEmail: string;
  items: WholesaleOrderItem[]; grandTotal: number; asap: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    console.log("[wholesale/orders] no RESEND_API_KEY, skipping email");
    return;
  }

  const { orderId, customerName, customerEmail, items, grandTotal, asap } = opts;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Inline logo as base64 data URI (works in all email clients)
  let logoDataUri = "";
  try {
    const logoPath = path.join(process.cwd(), "public", "icon-192.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch { /* logo is optional */ }

  // Generate PDF receipt — wrapped so a failure never blocks the email
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateOrderPdf({ orderId, customerName, customerEmail, items, grandTotal, asap, date });
  } catch (e) {
    console.error("[wholesale/orders] PDF generation failed:", e);
  }

  // Table rows with thumbnails, alternating dark shading
  const EVEN_ROW = "#1e1008";
  const ODD_ROW  = "#2a1510";
  const rows = items.map((item, idx) => {
    const imgUrl = absoluteUrl(item.imageUrl);
    const bg = idx % 2 === 0 ? EVEN_ROW : ODD_ROW;
    const imgCell = imgUrl
      ? `<td style="padding:8px 10px;width:48px;background:${bg}"><img src="${imgUrl}" alt="" width="36" height="36" style="display:block;object-fit:contain;background:#2e1a10;border-radius:5px" /></td>`
      : `<td style="padding:8px 10px;width:48px;background:${bg}"></td>`;
    return `
    <tr>
      ${imgCell}
      <td style="padding:8px 10px;background:${bg};color:#e8d5b0;font-size:13px">${item.designName}</td>
      <td style="padding:8px 10px;background:${bg};color:#8a7a6a;font-family:monospace;font-size:11px;text-align:center">${item.productId}</td>
      <td style="padding:8px 10px;background:${bg};color:#c8b89a;text-align:center;font-size:13px">${item.qty}</td>
      <td style="padding:8px 10px;background:${bg};color:#c8b89a;text-align:center;font-size:13px">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px 10px;background:${bg};color:#c9a84c;font-weight:700;text-align:right;font-size:13px">$${item.lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const logoImg = logoDataUri
    ? `<img src="${logoDataUri}" alt="Desert Fathers Studio" width="68" height="68" style="display:block;border-radius:50%;margin:0 auto 14px;border:2px solid rgba(201,168,76,0.4)">`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <title>Wholesale Order ${orderId}</title>
</head>
<body style="margin:0;padding:0;background:#1a0d08">
<div style="background:#1a0d08;padding:36px 16px;font-family:'Lato',Arial,sans-serif">
<div style="max-width:620px;margin:0 auto">

  <!-- Header -->
  <div style="background:#6B1F2A;border-radius:10px 10px 0 0;padding:32px 32px 26px;text-align:center">
    ${logoImg}
    <p style="margin:0 0 6px;color:#c9a84c;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;font-weight:700">Desert Fathers Studio</p>
    <h1 style="margin:0;color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:400;letter-spacing:-0.01em">${asap ? "⚡ ASAP — " : ""}New Wholesale Order</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.45);font-size:11px;font-family:monospace;letter-spacing:0.06em">${orderId} &nbsp;·&nbsp; ${date}</p>
  </div>

  <!-- Gold rule -->
  <div style="height:3px;background:linear-gradient(90deg,transparent,#c9a84c 15%,#c9a84c 85%,transparent)"></div>

  <!-- Body -->
  <div style="background:#1e1008;border-radius:0 0 10px 10px;padding:32px">

    ${asap ? `
    <div style="background:#3a2000;border:1px solid #c9a84c;border-radius:7px;padding:12px 18px;margin-bottom:24px;font-size:13px;font-weight:700;color:#f0c040">
      ⚡ ASAP — stock is critically low. Please prioritize this order.
    </div>` : ""}

    <!-- Thank you block -->
    <div style="background:#2a1610;border:1px solid rgba(107,31,42,0.6);border-radius:8px;padding:22px 26px;margin-bottom:28px">
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;color:#c9a84c;font-size:19px;font-weight:400">Thank you for your order</h2>
      <p style="margin:0;color:#b0a090;font-size:13.5px;line-height:1.65">
        Your order has been received and is being processed.<br>
        <strong style="color:#f0e8d8">${customerName}</strong> — we'll be in touch shortly.
      </p>
    </div>

    <!-- From info -->
    <p style="margin:0 0 24px;font-size:13px;color:#8a7a6a;line-height:1.7">
      <span style="color:#c8b89a;font-weight:600">From:</span>&nbsp; ${customerName}<br>
      <span style="color:#c8b89a;font-weight:600">Email:</span>&nbsp; ${customerEmail}
    </p>

    <!-- Decorative divider -->
    <div style="text-align:center;margin:0 0 24px;color:#6B1F2A;letter-spacing:0.35em;font-size:13px">✦ &nbsp; ✦ &nbsp; ✦</div>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#6B1F2A">
          <th style="padding:9px 10px;width:48px"></th>
          <th style="padding:9px 10px;text-align:left;color:#fff;font-weight:600;font-size:12px;letter-spacing:0.04em">Design</th>
          <th style="padding:9px 10px;text-align:center;color:#fff;font-weight:600;font-size:12px">SKU</th>
          <th style="padding:9px 10px;text-align:center;color:#fff;font-weight:600;font-size:12px">Qty</th>
          <th style="padding:9px 10px;text-align:center;color:#fff;font-weight:600;font-size:12px">Unit</th>
          <th style="padding:9px 10px;text-align:right;color:#fff;font-weight:600;font-size:12px">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="padding:14px 10px;border-top:2px solid #c9a84c;color:#c8b89a;font-weight:700;font-size:13px;text-align:right">Grand Total</td>
          <td style="padding:14px 10px;border-top:2px solid #c9a84c;color:#c9a84c;font-weight:700;font-size:16px;text-align:right">$${grandTotal.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    ${pdfBuffer ? `
    <!-- PDF note -->
    <p style="margin:18px 0 0;font-size:11px;color:#5a4a3a;font-style:italic;text-align:center">
      A PDF receipt is attached to this email.
    </p>` : ""}

    <!-- Footer divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,#6B1F2A 30%,#6B1F2A 70%,transparent);margin:28px 0 22px"></div>

    <!-- Footer -->
    <div style="text-align:center;color:#5a4a3a;font-size:11px;line-height:2">
      <a href="https://desertfathersstudio.com" style="color:#8a7060;text-decoration:none">desertfathersstudio.com</a>
      &nbsp;·&nbsp;
      <a href="mailto:desertfathersstudio@gmail.com" style="color:#8a7060;text-decoration:none">desertfathersstudio@gmail.com</a><br>
      <em style="color:#6a5a4a;font-size:12px;font-family:'Playfair Display',Georgia,serif">Thank you for your order — God bless your ministry</em>
    </div>

  </div>
</div>
</div>
</body>
</html>`.trim();

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [customerEmail, ADMIN_EMAIL],
      reply_to: ADMIN_EMAIL,
      subject: `${asap ? "⚡ ASAP — " : ""}Wholesale Order ${orderId}`,
      html,
      ...(pdfBuffer ? {
        attachments: [{ filename: `Receipt-${orderId}.pdf`, content: pdfBuffer.toString("base64") }],
      } : {}),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
}
