import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import { generateOrderPdf } from "@/lib/wholesale/generate-order-pdf";
import type { WholesaleOrder, WholesaleOrderItem, OrderStage } from "@/types/wholesale";

const ADMIN_EMAIL = "desertfathersstudio@gmail.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://desertfathersstudio.com";

type EmailAttachment = { filename: string; content: string; content_id?: string };

// Read logo once at module load — same approach pdfkit uses for the PDF
function readLogoBase64(): string | null {
  try {
    const p = path.join(process.cwd(), "public", "images", "Logo.png");
    if (fs.existsSync(p)) return fs.readFileSync(p).toString("base64");
    console.warn("[wholesale] Logo.png not found at", p);
  } catch (e) {
    console.error("[wholesale] logo read error:", e);
  }
  return null;
}
const LOGO_B64 = readLogoBase64();

async function nextOrderNumber(sb: ReturnType<typeof createSupabaseService>): Promise<string> {
  const { count } = await sb
    .from("wholesale_orders")
    .select("*", { count: "exact", head: true });
  const n = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `WS-${n}`;
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

    // Decrement inventory — if it succeeds, flag the order so cancel/delete can restore it
    const { error: rpcErr } = await sb.rpc("wholesale_adjust_inventory", { p_items: items, p_delta: -1 });
    if (rpcErr) {
      console.error("[wholesale] inventory adjust failed:", rpcErr);
    } else {
      const { error: flagErr } = await sb.from("wholesale_orders")
        .update({ inventory_adjusted: true })
        .eq("order_id", orderId);
      if (flagErr) console.error("[wholesale] inventory_adjusted flag update failed:", flagErr);
    }

    // Fire-and-forget — customer gets the response immediately
    sendOrderEmails({ orderId, customerName, customerEmail, items, grandTotal, asap })
      .catch((e) => console.error("[wholesale/orders] email failed:", e));

    return NextResponse.json({ orderId });
  } catch (err) {
    console.error("[wholesale/orders POST]", err);
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}

// ─── Main email dispatcher ─────────────────────────────────────────────────

async function sendOrderEmails(opts: {
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
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const from = `Desert Fathers Studio <${fromEmail}>`;

  // Logo: CID inline attachment (works in all email clients, no external URL needed)
  const logoAttachment: EmailAttachment | null = LOGO_B64
    ? { filename: "Logo.png", content: LOGO_B64, content_id: "dfs-logo" }
    : null;
  const logoSrc = logoAttachment ? "cid:dfs-logo" : `${SITE_URL}/images/Logo.png`;

  // Generate PDF (non-blocking — failure doesn't prevent emails)
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateOrderPdf({ orderId, customerName, customerEmail, items, grandTotal, asap, date });
  } catch (e) {
    console.error("[wholesale/orders] PDF generation failed:", e);
  }

  const pdfAttachment: EmailAttachment | null = pdfBuffer
    ? { filename: `Receipt-${orderId}.pdf`, content: pdfBuffer.toString("base64") }
    : null;

  await Promise.all([
    sendCustomerEmail({ apiKey, from, orderId, customerName, customerEmail, items, grandTotal, asap, date, logoSrc, logoAttachment, pdfAttachment }),
    sendAdminEmail({ apiKey, from, orderId, customerName, customerEmail, items, grandTotal, asap, date, logoSrc, logoAttachment }),
  ]);
}

// ─── Customer email — rich dark receipt ────────────────────────────────────

async function sendCustomerEmail(opts: {
  apiKey: string; from: string; orderId: string; customerName: string;
  customerEmail: string; items: WholesaleOrderItem[]; grandTotal: number;
  asap: boolean; date: string; logoSrc: string; logoAttachment: EmailAttachment | null;
  pdfAttachment: EmailAttachment | null;
}) {
  const { apiKey, from, orderId, customerName, customerEmail, items, grandTotal, asap, date, logoSrc, logoAttachment, pdfAttachment } = opts;

  const EVEN = "#111d2e";
  const ODD  = "#0d1829";

  const rows = items.map((item, idx) => {
    const bg = idx % 2 === 0 ? EVEN : ODD;
    const imgSrc = item.imageUrl
      ? (item.imageUrl.startsWith("http") ? item.imageUrl : `${SITE_URL}${item.imageUrl}`)
      : null;
    const imgCell = imgSrc
      ? `<td style="padding:8px 10px;width:48px;background:${bg}"><img src="${imgSrc}" alt="" width="36" height="36" style="display:block;object-fit:contain;background:#1a2744;border-radius:5px" /></td>`
      : `<td style="padding:8px 10px;width:48px;background:${bg}"></td>`;
    return `<tr>
      ${imgCell}
      <td style="padding:8px 10px;background:${bg};color:#d8e4f0;font-size:13px">${item.designName}</td>
      <td style="padding:8px 10px;background:${bg};color:#5a7090;font-family:monospace;font-size:11px;text-align:center">${item.productId}</td>
      <td style="padding:8px 10px;background:${bg};color:#8aadcc;text-align:center;font-size:13px">${item.qty}</td>
      <td style="padding:8px 10px;background:${bg};color:#8aadcc;text-align:center;font-size:13px">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px 10px;background:${bg};color:#c9a84c;font-weight:700;text-align:right;font-size:13px">$${item.lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const logoImg = `<img src="${logoSrc}" alt="Desert Fathers Studio" width="90" height="90" style="display:block;margin:0 auto 14px;border-radius:12px">`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <title>Order Confirmation — ${orderId}</title>
</head>
<body style="margin:0;padding:0;background:#080e18">
<div style="background:#080e18;padding:36px 16px;font-family:'Lato',Arial,sans-serif">
<div style="max-width:620px;margin:0 auto">

  <!-- Header -->
  <div style="background:#1a2744;border-radius:10px 10px 0 0;padding:34px 32px 28px;text-align:center">
    ${logoImg}
    <p style="margin:0 0 6px;color:#c9a84c;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;font-weight:700">Desert Fathers Studio</p>
    <h1 style="margin:0;color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:400;letter-spacing:-0.01em">${asap ? "⚡ ASAP — " : ""}Order Confirmation</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:11px;font-family:monospace;letter-spacing:0.06em">${orderId} &nbsp;·&nbsp; ${date}</p>
  </div>

  <!-- Gold rule -->
  <div style="height:3px;background:linear-gradient(90deg,transparent,#c9a84c 15%,#c9a84c 85%,transparent)"></div>

  <!-- Body -->
  <div style="background:#0d1520;border-radius:0 0 10px 10px;padding:32px">

    ${asap ? `<div style="background:#1e2800;border:1px solid #c9a84c;border-radius:7px;padding:12px 18px;margin-bottom:24px;font-size:13px;font-weight:700;color:#f0c040">
      ⚡ ASAP — stock is critically low. Please prioritize this order.
    </div>` : ""}

    <!-- Thank you block -->
    <div style="background:#101e35;border:1px solid rgba(26,39,68,0.8);border-left:3px solid #c9a84c;border-radius:8px;padding:22px 26px;margin-bottom:28px">
      <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;color:#c9a84c;font-size:19px;font-weight:400">Thank you for your order</h2>
      <p style="margin:0;color:#7a9ab8;font-size:13.5px;line-height:1.65">
        Your order has been received and is being processed.<br>
        <strong style="color:#d8e4f0">${customerName}</strong> — we'll be in touch shortly.
      </p>
    </div>

    <!-- From info -->
    <p style="margin:0 0 24px;font-size:13px;color:#4a6a88;line-height:1.7">
      <span style="color:#8aadcc;font-weight:600">From:</span>&nbsp; ${customerName}<br>
      <span style="color:#8aadcc;font-weight:600">Email:</span>&nbsp; ${customerEmail}
    </p>

    <!-- Decorative divider -->
    <div style="text-align:center;margin:0 0 24px;color:#1a2744;letter-spacing:0.35em;font-size:14px;opacity:0.7">✦ &nbsp; ✦ &nbsp; ✦</div>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#1a2744">
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
          <td colspan="5" style="padding:14px 10px;border-top:2px solid #c9a84c;color:#8aadcc;font-weight:700;font-size:13px;text-align:right">Grand Total</td>
          <td style="padding:14px 10px;border-top:2px solid #c9a84c;color:#c9a84c;font-weight:700;font-size:16px;text-align:right">$${grandTotal.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    ${pdfAttachment ? `<p style="margin:18px 0 0;font-size:11px;color:#3a5068;font-style:italic;text-align:center">A PDF receipt is attached to this email.</p>` : ""}

    <!-- Footer divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,#1a2744 30%,#1a2744 70%,transparent);margin:28px 0 22px"></div>

    <!-- Footer -->
    <div style="text-align:center;color:#2a3a50;font-size:11px;line-height:2">
      <a href="https://desertfathersstudio.com" style="color:#4a6a88;text-decoration:none">desertfathersstudio.com</a>
      &nbsp;·&nbsp;
      <a href="mailto:desertfathersstudio@gmail.com" style="color:#4a6a88;text-decoration:none">desertfathersstudio@gmail.com</a><br>
      <em style="color:#3a5068;font-size:12px;font-family:'Playfair Display',Georgia,serif">Thank you for your order — God bless your ministry</em>
    </div>

  </div>
</div>
</div>
</body>
</html>`;

  const attachments: EmailAttachment[] = [
    ...(logoAttachment ? [logoAttachment] : []),
    ...(pdfAttachment ? [pdfAttachment] : []),
  ];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [customerEmail],
      reply_to: ADMIN_EMAIL,
      subject: `${asap ? "⚡ ASAP — " : ""}Order Confirmation from DFS — ${orderId}`,
      html,
      ...(attachments.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend customer email ${res.status}: ${await res.text()}`);
}

// ─── Admin email — clean packing list ──────────────────────────────────────

async function sendAdminEmail(opts: {
  apiKey: string; from: string; orderId: string; customerName: string;
  customerEmail: string; items: WholesaleOrderItem[]; grandTotal: number;
  asap: boolean; date: string; logoSrc: string; logoAttachment: EmailAttachment | null;
}) {
  const { apiKey, from, orderId, customerName, customerEmail, items, grandTotal, asap, date, logoSrc, logoAttachment } = opts;

  const packRows = items.map((item, idx) => {
    const bg = idx % 2 === 0 ? "#ffffff" : "#f4f7fb";
    const imgSrc = item.imageUrl
      ? (item.imageUrl.startsWith("http") ? item.imageUrl : `${SITE_URL}${item.imageUrl}`)
      : null;
    const imgCell = imgSrc
      ? `<td style="padding:10px 12px;width:52px;background:${bg}"><img src="${imgSrc}" alt="" width="40" height="40" style="display:block;object-fit:contain;background:#eef2f8;border-radius:5px;border:1px solid #dde4ef" /></td>`
      : `<td style="padding:10px 12px;width:52px;background:${bg}"></td>`;
    return `<tr>
      ${imgCell}
      <td style="padding:10px 12px;background:${bg};color:#1a2744;font-size:14px;font-weight:600">${item.designName}</td>
      <td style="padding:10px 12px;background:${bg};color:#7a8ea8;font-family:monospace;font-size:12px;text-align:center">${item.productId}</td>
      <td style="padding:10px 14px;background:${bg};text-align:center">
        <span style="background:#1a2744;color:#fff;font-size:16px;font-weight:800;padding:4px 12px;border-radius:5px;display:inline-block">${item.qty}</span>
      </td>
      <td style="padding:10px 12px;background:${bg};color:#4a6a88;text-align:center;font-size:13px">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding:10px 12px;background:${bg};color:#1a2744;font-weight:700;text-align:right;font-size:14px">$${item.lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const logoImg = `<img src="${logoSrc}" alt="Desert Fathers Studio" width="44" height="44" style="display:block;border-radius:6px">`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Packing List — ${orderId}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f8;font-family:Arial,sans-serif">
<div style="background:#eef2f8;padding:28px 16px">
<div style="max-width:640px;margin:0 auto">

  <!-- Header -->
  <div style="background:#1a2744;border-radius:10px 10px 0 0;padding:20px 28px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="width:52px;vertical-align:middle">${logoImg}</td>
        <td style="padding-left:14px;vertical-align:middle">
          <p style="margin:0;color:#c9a84c;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700">Desert Fathers Studio</p>
          <h1 style="margin:4px 0 0;color:#fff;font-size:18px;font-weight:700">${asap ? "⚡ ASAP — " : ""}Packing List</h1>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <p style="margin:0;color:#c9a84c;font-size:14px;font-weight:700;font-family:monospace">${orderId}</p>
          <p style="margin:3px 0 0;color:rgba(255,255,255,0.5);font-size:11px">${date}</p>
        </td>
      </tr>
    </table>
  </div>
  <div style="height:3px;background:linear-gradient(90deg,#c9a84c,#e8c96c,#c9a84c)"></div>

  <!-- Body -->
  <div style="background:#fff;padding:24px 28px">

    ${asap ? `<div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;margin-bottom:20px;font-size:13px;font-weight:700;color:#92400e">
      ⚡ ASAP — stock is critically low. Pack and ship as soon as possible.
    </div>` : ""}

    <!-- Ship to -->
    <div style="background:#f4f7fb;border-left:3px solid #1a2744;border-radius:0 6px 6px 0;padding:14px 18px;margin-bottom:24px">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#7a8ea8;letter-spacing:0.15em;text-transform:uppercase">Ship To</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#1a2744">${customerName}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#4a6a88">${customerEmail}</p>
    </div>

    <!-- Items to pack -->
    <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#7a8ea8;letter-spacing:0.15em;text-transform:uppercase">Items to Pack</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #dde4ef">
      <thead>
        <tr style="background:#1a2744">
          <th style="padding:10px 12px;width:52px"></th>
          <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px;font-weight:600">Design</th>
          <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px;font-weight:600">SKU</th>
          <th style="padding:10px 12px;text-align:center;color:#c9a84c;font-size:12px;font-weight:700">QTY</th>
          <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px;font-weight:600">Unit</th>
          <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px;font-weight:600">Total</th>
        </tr>
      </thead>
      <tbody>${packRows}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #1a2744">
          <td colspan="5" style="padding:14px 12px;font-weight:700;font-size:14px;color:#1a2744;text-align:right">Grand Total</td>
          <td style="padding:14px 12px;font-weight:800;font-size:17px;color:#1a2744;text-align:right">$${grandTotal.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="margin:16px 0 0;font-size:12px;color:#7a8ea8;text-align:right">
      ${items.reduce((s, i) => s + i.qty, 0)} total stickers &nbsp;·&nbsp; ${items.length} line item${items.length !== 1 ? "s" : ""}
    </p>

  </div>

  <!-- Footer -->
  <div style="background:#f4f7fb;border-radius:0 0 10px 10px;padding:14px 28px;text-align:center">
    <p style="margin:0;font-size:11px;color:#7a8ea8">
      Replied to <a href="mailto:${customerEmail}" style="color:#1a2744;text-decoration:none">${customerEmail}</a>
      &nbsp;·&nbsp; desertfathersstudio.com
    </p>
  </div>

</div>
</div>
</body>
</html>`;

  const adminAttachments: EmailAttachment[] = logoAttachment ? [logoAttachment] : [];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [ADMIN_EMAIL],
      reply_to: customerEmail,
      subject: `${asap ? "⚡ ASAP — " : ""}📦 Pack & Ship: ${orderId} | ${customerName}`,
      html,
      ...(adminAttachments.length ? { attachments: adminAttachments } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend admin email ${res.status}: ${await res.text()}`);
}
