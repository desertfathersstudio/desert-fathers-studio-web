import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { getAccountById, ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import type { WholesaleOrder, WholesaleOrderItem, OrderStage } from "@/types/wholesale";

function randomId(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    accountId,
    customerName,
    customerEmail,
    items,
    grandTotal,
    asap,
  } = body as {
    accountId: string;
    customerName: string;
    customerEmail: string;
    items: WholesaleOrderItem[];
    grandTotal: number;
    asap: boolean;
  };

  if (!accountId || !ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const orderId = `WS-${accountId}-${dateStamp()}-${randomId()}`;

  try {
    const sb = createSupabaseService();
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

    // Send notification email via Resend if key is configured
    try {
      await sendOrderEmail({ orderId, customerName, customerEmail, items, grandTotal, asap });
    } catch (emailErr) {
      console.error("[wholesale/orders] email error:", emailErr);
    }

    return NextResponse.json({ orderId });
  } catch (err) {
    console.error("[wholesale/orders POST]", err);
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}

async function sendOrderEmail(opts: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: WholesaleOrderItem[];
  grandTotal: number;
  asap: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[wholesale/orders] no RESEND_API_KEY, skipping email");
    return;
  }

  const { orderId, customerName, customerEmail, items, grandTotal, asap } = opts;

  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 8px">${i.designName}</td>
          <td style="padding:6px 8px;text-align:center">${i.productId}</td>
          <td style="padding:6px 8px;text-align:center">${i.qty}</td>
          <td style="padding:6px 8px;text-align:center">$${i.unitPrice.toFixed(2)}</td>
          <td style="padding:6px 8px;text-align:right;font-weight:700;color:#6b1d3b">$${i.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:620px;color:#2a1a0e">
      <div style="background:#6b1d3b;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:1.1rem">
          ${asap ? "⚡ ASAP — " : ""}New Wholesale Order
        </h2>
        <p style="margin:4px 0 0;opacity:.8;font-size:.85rem">${orderId}</p>
      </div>
      <div style="border:1px solid #e5d9c8;border-top:none;padding:16px 20px;border-radius:0 0 8px 8px">
        <p><strong>Account:</strong> ${customerName}<br>
        <strong>Email:</strong> ${customerEmail}</p>
        ${asap ? '<p style="background:#fff3cd;border:1px solid #ffc107;padding:10px;border-radius:6px;font-weight:700">⚡ ASAP — stock is critically low. Please prioritize.</p>' : ""}
        <table style="width:100%;border-collapse:collapse;font-size:.9rem">
          <thead>
            <tr style="background:#f9f6f1">
              <th style="padding:6px 8px;text-align:left">Design</th>
              <th style="padding:6px 8px;text-align:center">SKU</th>
              <th style="padding:6px 8px;text-align:center">Qty</th>
              <th style="padding:6px 8px;text-align:center">Unit</th>
              <th style="padding:6px 8px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align:right;margin-top:12px;font-size:1rem">
          <strong>Grand Total: $${grandTotal.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  `.trim();

  const from = process.env.RESEND_FROM_EMAIL ?? "orders@desertfathersstudio.com";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: customerEmail,
      reply_to: "desertfathersstudio@gmail.com",
      subject: `${asap ? "⚡ ASAP — " : ""}Wholesale Order ${orderId}`,
      html,
    }),
  });
}
