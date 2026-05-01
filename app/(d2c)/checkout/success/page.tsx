import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Package, Truck, ArrowRight, XCircle } from "lucide-react";
import { createSupabaseService } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { CATALOG } from "@/lib/catalog";
import { CartClearer } from "./CartClearer";

// ── Types ──────────────────────────────────────────────────────────────
interface OrderItem {
  productId: string;
  productName: string;
  filename: string;
  quantity: number;
  unitCents: number;
  lineCents: number;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: Record<string, string | null | undefined> | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

// ── Catalog lookup for sticker images ─────────────────────────────────
const catalogFilename = (productId: string) =>
  CATALOG.find((s) => s.id === productId)?.filename ?? "";

// ── Data fetching — Supabase first, Stripe fallback ───────────────────
async function fetchOrder(piId: string): Promise<OrderData | null> {
  // 1. Try Supabase — should exist once webhook has fired
  try {
    const supabase = createSupabaseService();
    const { data } = await supabase
      .from("retail_orders")
      .select(`
        order_number,
        customer_name,
        customer_email,
        shipping_address,
        subtotal_cents,
        shipping_cents,
        total_cents,
        retail_order_items (
          product_id,
          product_name,
          quantity,
          unit_price_cents,
          line_total_cents
        )
      `)
      .eq("stripe_pi_id", piId)
      .maybeSingle();

    if (data) {
      const items: OrderItem[] = (data.retail_order_items ?? []).map(
        (i: {
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
        }) => ({
          productId:   i.product_id,
          productName: i.product_name,
          filename:    catalogFilename(i.product_id),
          quantity:    i.quantity,
          unitCents:   i.unit_price_cents,
          lineCents:   i.line_total_cents,
        })
      );
      return {
        orderNumber:     data.order_number,
        customerName:    data.customer_name,
        customerEmail:   data.customer_email,
        items,
        shippingAddress: data.shipping_address as Record<string, string | null | undefined> | null,
        subtotalCents:   data.subtotal_cents,
        shippingCents:   data.shipping_cents,
        totalCents:      data.total_cents,
      };
    }
  } catch (err) {
    console.error("[success-page] Supabase fetch failed:", err);
  }

  // 2. Stripe fallback — catches the webhook race condition window.
  //    Server-side retrieve includes full metadata (unlike client-side retrievePaymentIntent).
  try {
    const pi = await stripe.paymentIntents.retrieve(piId);
    if (pi.status !== "succeeded") return null;

    const meta = pi.metadata ?? {};
    const orderNumber = `DFS-${piId.replace("pi_", "").slice(0, 8).toUpperCase()}`;

    let rawItems: Array<{ id: string; name: string; qty: number; unit: number }> = [];
    try { rawItems = JSON.parse(meta.items ?? "[]"); } catch { /* ignore */ }

    const items: OrderItem[] = rawItems.map((i) => ({
      productId:   i.id,
      productName: i.name,
      filename:    catalogFilename(i.id),
      quantity:    i.qty,
      unitCents:   i.unit,
      lineCents:   i.unit * i.qty,
    }));

    const addr = pi.shipping?.address ?? null;

    return {
      orderNumber,
      customerName:    pi.shipping?.name ?? meta.customer_name ?? "",
      customerEmail:   pi.receipt_email  ?? meta.customer_email ?? "",
      items,
      shippingAddress: addr
        ? {
            line1:       addr.line1,
            line2:       addr.line2,
            city:        addr.city,
            state:       addr.state,
            postal_code: addr.postal_code,
          }
        : null,
      subtotalCents: parseInt(meta.subtotal_cents ?? "0", 10),
      shippingCents: parseInt(meta.shipping_cents  ?? "0", 10),
      totalCents:    pi.amount,
    };
  } catch (err) {
    console.error("[success-page] Stripe fallback failed:", err);
    return null;
  }
}

// ── Failed view ────────────────────────────────────────────────────────
function FailedView() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="text-center max-w-sm">
        <XCircle size={48} className="mx-auto mb-4" style={{ color: "#c0392b" }} />
        <h1
          className="font-serif text-2xl font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          Payment unsuccessful
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Your card was not charged. Please try again or use a different payment method.
        </p>
        <Link
          href="/checkout/details"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
          style={{ background: "var(--brand)", color: "#fff", borderRadius: "var(--radius-btn)" }}
        >
          Try again
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ── Success view ───────────────────────────────────────────────────────
function SuccessView({ order }: { order: OrderData }) {
  const addr = order.shippingAddress;
  const addrLine = [addr?.line1, addr?.city, addr?.state, addr?.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100svh" }}>
      <header
        className="px-6 py-4 flex items-center justify-center"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <span className="font-serif text-lg font-semibold" style={{ color: "var(--text)" }}>
          Desert Fathers Studio
        </span>
      </header>

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(107,31,42,0.08)" }}
          >
            <CheckCircle size={32} style={{ color: "var(--brand)" }} />
          </div>
          <h1
            className="font-serif text-3xl font-semibold mb-2"
            style={{ color: "var(--text)" }}
          >
            Order Confirmed
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {order.customerEmail && (
              <>
                A confirmation has been sent to{" "}
                <strong style={{ color: "var(--text)" }}>{order.customerEmail}</strong>
                <br />
              </>
            )}
            Order{" "}
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Order card */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          {/* Items */}
          <div className="px-6 py-5">
            <h2
              className="text-xs font-medium uppercase tracking-wide mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Items
            </h2>
            <ul className="space-y-4">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  {item.filename && (
                    <div
                      className="relative shrink-0 rounded-lg overflow-hidden"
                      style={{
                        width: 48,
                        height: 48,
                        border: "1px solid var(--border)",
                        background: "#fff",
                      }}
                    >
                      <Image
                        src={`/stickers/${item.filename}`}
                        alt={item.productName}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium leading-snug"
                      style={{ color: "var(--text)" }}
                    >
                      {item.productName}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span
                    className="text-sm tabular-nums shrink-0"
                    style={{ color: "var(--text)" }}
                  >
                    ${(item.lineCents / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* Totals */}
          <div className="px-6 py-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span className="tabular-nums" style={{ color: "var(--text)" }}>
                ${(order.subtotalCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Shipping</span>
              <span className="tabular-nums" style={{ color: "var(--text)" }}>
                {order.shippingCents === 0
                  ? "Free"
                  : `$${(order.shippingCents / 100).toFixed(2)}`}
              </span>
            </div>
            <div
              className="flex justify-between font-semibold text-base pt-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--text)" }}>Total</span>
              <span className="tabular-nums" style={{ color: "var(--text)" }}>
                ${(order.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping address */}
          {addrLine && (
            <>
              <div style={{ borderTop: "1px solid var(--border)" }} />
              <div className="px-6 py-5">
                <h2
                  className="text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Shipping to
                </h2>
                <p className="text-sm" style={{ color: "var(--text)" }}>
                  {order.customerName && (
                    <>
                      {order.customerName}
                      <br />
                    </>
                  )}
                  {addrLine}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Delivery estimate */}
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl mb-10"
          style={{
            background: "rgba(107,31,42,0.05)",
            border: "1px solid rgba(107,31,42,0.12)",
          }}
        >
          <Truck size={20} style={{ color: "var(--brand)" }} className="shrink-0" />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Estimated delivery: 3–7 business days
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              You&rsquo;ll receive a shipping confirmation once your order ships.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--brand)", color: "#fff", borderRadius: "var(--radius-btn)" }}
          >
            <Package size={15} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page (server component) ────────────────────────────────────────────
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const piId          = params.payment_intent as string | undefined;
  const redirectStatus = params.redirect_status as string | undefined;

  if (!piId) redirect("/shop");

  if (redirectStatus === "failed") {
    return <FailedView />;
  }

  const order = await fetchOrder(piId);

  if (!order) {
    // PI not found or not succeeded — treat as failure
    return <FailedView />;
  }

  return (
    <>
      <CartClearer />
      <SuccessView order={order} />
    </>
  );
}
