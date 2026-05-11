"use server";

import { after } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import type { OrderStage, WholesaleOrderItem } from "@/types/wholesale";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://desertfathersstudio.com";

export async function adminUpdateOrderStage(orderId: string, stage: OrderStage) {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_orders")
    .update({ order_stage: stage })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminUpdateTracking(orderId: string, trackingNumber: string | null) {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_orders")
    .update({ tracking_number: trackingNumber })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminConfirmPaymentReceived(orderId: string, received: boolean) {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_orders")
    .update({
      payment_received: received,
      payment_received_date: received ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminCancelWholesaleOrder(orderId: string) {
  const sb = createSupabaseService();

  const { data, error: fetchErr } = await sb
    .from("wholesale_orders")
    .select("items, order_stage, inventory_adjusted")
    .eq("order_id", orderId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  if (data.order_stage === "Cancelled") throw new Error("Order is already cancelled");

  // Only restore inventory if we actually decremented it when the order was placed
  if (data.inventory_adjusted) {
    const { error: rpcErr } = await sb.rpc("wholesale_adjust_inventory", {
      p_items: data.items,
      p_delta: 1,
    });
    if (rpcErr) console.error("[adminCancelWholesaleOrder] inventory restore failed:", rpcErr);
  }

  const { error } = await sb
    .from("wholesale_orders")
    .update({ order_stage: "Cancelled", inventory_adjusted: false })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminApplyDiscount(orderId: string, discountAmount: number, discountNote: string | null) {
  const sb = createSupabaseService();
  const { data, error: fetchErr } = await sb
    .from("wholesale_orders")
    .select("items, customer_name, customer_email")
    .eq("order_id", orderId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const items = (data.items as WholesaleOrderItem[]) ?? [];
  const originalTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const effectiveTotal = Math.max(0, originalTotal - discountAmount);

  const { error } = await sb
    .from("wholesale_orders")
    .update({ discount_amount: discountAmount, discount_note: discountNote || null, grand_total: effectiveTotal })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);

  after(async () => {
    try {
      await sendDiscountEmail({
        orderId,
        customerName: String(data.customer_name),
        customerEmail: String(data.customer_email),
        originalTotal,
        discountAmount,
        effectiveTotal,
        discountNote: discountNote || null,
      });
    } catch (e) {
      console.error("[adminApplyDiscount] email failed:", e);
    }
  });

  return { originalTotal, effectiveTotal, discountAmount, discountNote: discountNote || null };
}

async function sendDiscountEmail(opts: {
  orderId: string; customerName: string; customerEmail: string;
  originalTotal: number; discountAmount: number; effectiveTotal: number;
  discountNote: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") return;

  const { orderId, customerName, customerEmail, originalTotal, discountAmount, effectiveTotal, discountNote } = opts;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const from = `Desert Fathers Studio <${fromEmail}>`;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const isRemoval = discountAmount === 0;
  const subjectLine = isRemoval
    ? `Order Total Updated — ${orderId}`
    : `Your Order Total Has Changed — ${orderId}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <title>${subjectLine}</title>
</head>
<body style="margin:0;padding:0;background:#080e18">
<div style="background:#080e18;padding:36px 16px;font-family:'Lato',Arial,sans-serif">
<div style="max-width:580px;margin:0 auto">

  <!-- Header -->
  <div style="background:#1a2744;border-radius:10px 10px 0 0;padding:34px 32px 28px;text-align:center">
    <img src="${SITE_URL}/images/Logo.png" alt="Desert Fathers Studio" width="72" height="72" style="display:block;margin:0 auto 14px;border-radius:10px">
    <p style="margin:0 0 6px;color:#c9a84c;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;font-weight:700">Desert Fathers Studio</p>
    <h1 style="margin:0;color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:21px;font-weight:400;letter-spacing:-0.01em">
      ${isRemoval ? "Order Total Updated" : "Your Order Total Has Changed"}
    </h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:11px;font-family:monospace;letter-spacing:0.06em">${orderId} &nbsp;·&nbsp; ${date}</p>
  </div>

  <!-- Gold rule -->
  <div style="height:3px;background:linear-gradient(90deg,transparent,#c9a84c 15%,#c9a84c 85%,transparent)"></div>

  <!-- Body -->
  <div style="background:#0d1520;border-radius:0 0 10px 10px;padding:32px">

    <div style="background:#101e35;border:1px solid rgba(26,39,68,0.8);border-left:3px solid #c9a84c;border-radius:8px;padding:22px 26px;margin-bottom:28px">
      <p style="margin:0;color:#7a9ab8;font-size:13.5px;line-height:1.7">
        Hi <strong style="color:#d8e4f0">${customerName}</strong>,<br><br>
        ${isRemoval
          ? `A previously applied discount on order <strong style="color:#c9a84c;font-family:monospace">${orderId}</strong> has been removed. Your order total has been restored to the original amount.`
          : `A credit has been applied to your order <strong style="color:#c9a84c;font-family:monospace">${orderId}</strong> to reflect a recent adjustment. Here's a summary of the updated total:`
        }
      </p>
    </div>

    ${discountNote ? `<!-- Note block -->
    <div style="background:#111d2e;border:1px solid #1e3a5a;border-left:3px solid #c9a84c;border-radius:8px;padding:14px 20px;margin-bottom:24px">
      <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:#c9a84c;letter-spacing:0.2em;text-transform:uppercase">Reason</p>
      <p style="margin:0;font-size:13.5px;color:#d8e4f0;line-height:1.65;white-space:pre-wrap">${discountNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    </div>` : ""}

    <!-- Total breakdown -->
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr>
        <td style="padding:11px 14px;background:#111d2e;color:#7a9ab8">Original total</td>
        <td style="padding:11px 14px;background:#111d2e;color:#d8e4f0;text-align:right;font-weight:600">$${originalTotal.toFixed(2)}</td>
      </tr>
      ${!isRemoval ? `<tr>
        <td style="padding:11px 14px;background:#0d1829;color:#22c55e">Credit applied</td>
        <td style="padding:11px 14px;background:#0d1829;color:#22c55e;text-align:right;font-weight:700">−$${discountAmount.toFixed(2)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:14px;background:#1a2744;color:#fff;font-weight:700;font-size:15px;border-top:2px solid #c9a84c">New total</td>
        <td style="padding:14px;background:#1a2744;color:#c9a84c;font-weight:800;font-size:18px;text-align:right;border-top:2px solid #c9a84c">$${effectiveTotal.toFixed(2)}</td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:12.5px;color:#4a6a88;line-height:1.7;text-align:center">
      Please use <strong style="color:#7a9ab8">$${effectiveTotal.toFixed(2)}</strong> as the amount when sending payment for this order.<br>
      Questions? Reply to this email or reach us at <a href="mailto:desertfathersstudio@gmail.com" style="color:#8aadcc;text-decoration:none">desertfathersstudio@gmail.com</a>
    </p>

    <div style="height:1px;background:linear-gradient(90deg,transparent,#1a2744 30%,#1a2744 70%,transparent);margin:0 0 22px"></div>

    <div style="text-align:center;color:#2a3a50;font-size:11px;line-height:2">
      <a href="${SITE_URL}" style="color:#4a6a88;text-decoration:none">desertfathersstudio.com</a>
      &nbsp;·&nbsp;
      <a href="mailto:desertfathersstudio@gmail.com" style="color:#4a6a88;text-decoration:none">desertfathersstudio@gmail.com</a><br>
      <em style="color:#3a5068;font-size:12px;font-family:'Playfair Display',Georgia,serif">God bless your ministry</em>
    </div>
  </div>

</div>
</div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [customerEmail],
      reply_to: "desertfathersstudio@gmail.com",
      subject: subjectLine,
      html,
    }),
  });
  if (!res.ok) console.error("[sendDiscountEmail] Resend error:", res.status, await res.text());
}

export async function adminDeleteWholesaleOrder(orderId: string) {
  const sb = createSupabaseService();

  const { data, error: fetchErr } = await sb
    .from("wholesale_orders")
    .select("items, order_stage, inventory_adjusted")
    .eq("order_id", orderId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  // Only restore inventory if we actually decremented it (and it wasn't already restored by cancel)
  if (data.inventory_adjusted) {
    const { error: rpcErr } = await sb.rpc("wholesale_adjust_inventory", {
      p_items: data.items,
      p_delta: 1,
    });
    if (rpcErr) console.error("[adminDeleteWholesaleOrder] inventory restore failed:", rpcErr);
  }

  const { error } = await sb
    .from("wholesale_orders")
    .delete()
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}
