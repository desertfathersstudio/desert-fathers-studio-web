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

/** Make relative /stickers/... URLs absolute for use in emails */
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

  // Generate PDF receipt (async, does not block the order response)
  const pdfBuffer = await generateOrderPdf({ orderId, customerName, customerEmail, items, grandTotal, asap, date });

  // Build HTML rows with sticker thumbnails
  const rows = items.map((i) => {
    const imgUrl = absoluteUrl(i.imageUrl);
    const imgCell = imgUrl
      ? `<td style="padding:6px 8px;border-bottom:1px solid #f0e8dc;width:44px"><img src="${imgUrl}" alt="" width="36" height="36" style="object-fit:contain;background:#f5f0e8;border-radius:4px;display:block" /></td>`
      : `<td style="padding:6px 8px;border-bottom:1px solid #f0e8dc;width:44px"></td>`;
    return `
    <tr>
      ${imgCell}
      <td style="padding:6px 8px;border-bottom:1px solid #f0e8dc">${i.designName}</td>
      <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #f0e8dc;font-family:monospace;font-size:.8rem;color:#7a6a5a">${i.productId}</td>
      <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #f0e8dc">${i.qty}</td>
      <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #f0e8dc">$${i.unitPrice.toFixed(2)}</td>
      <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #f0e8dc;font-weight:700;color:#6B1F2A">$${i.lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const html = `
<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;color:#2a1a0e;background:#faf6f0;border-radius:8px;overflow:hidden">
  <div style="background:#6B1F2A;color:#fff;padding:20px 24px">
    <p style="margin:0 0 4px;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;opacity:.7">Desert Fathers Studio</p>
    <h1 style="margin:0;font-size:1.2rem;font-weight:400">${asap ? "⚡ ASAP — " : ""}New Wholesale Order</h1>
    <p style="margin:6px 0 0;opacity:.7;font-size:.82rem;font-family:monospace">${orderId} · ${date}</p>
  </div>
  <div style="padding:20px 24px">
    ${asap ? '<div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:.85rem;font-weight:600;color:#856404">⚡ ASAP — stock is critically low. Please prioritize.</div>' : ""}
    <p style="margin:0 0 16px;font-size:.88rem"><strong>From:</strong> ${customerName}<br><strong>Email:</strong> ${customerEmail}</p>
    <table style="width:100%;border-collapse:collapse;font-size:.85rem">
      <thead>
        <tr style="background:#f0e8dc">
          <th style="padding:7px 8px;width:44px"></th>
          <th style="padding:7px 8px;text-align:left;font-weight:600">Design</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600">SKU</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600">Qty</th>
          <th style="padding:7px 8px;text-align:center;font-weight:600">Unit</th>
          <th style="padding:7px 8px;text-align:right;font-weight:600">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;margin:14px 0 0;font-size:1rem;font-weight:700">
      Grand Total: <span style="color:#6B1F2A">$${grandTotal.toFixed(2)}</span>
    </p>
    <p style="margin:20px 0 0;font-size:.78rem;color:#7a6a5a">A PDF receipt is attached to this email.</p>
  </div>
</div>`.trim();

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
      attachments: [
        {
          filename: `Receipt-${orderId}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
}
