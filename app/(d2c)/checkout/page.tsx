"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, Trash2, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD_DOLLARS } from "@/lib/shipping";
import type { CartItem } from "@/lib/cart";

// ── Free-shipping progress bar ─────────────────────────────────────────
function FreeShippingBar({ subtotalDollars }: { subtotalDollars: number }) {
  const pct = Math.min((subtotalDollars / FREE_SHIPPING_THRESHOLD_DOLLARS) * 100, 100);
  const amountToFree = Math.max(FREE_SHIPPING_THRESHOLD_DOLLARS - subtotalDollars, 0);
  const met = subtotalDollars >= FREE_SHIPPING_THRESHOLD_DOLLARS;

  return (
    <div className="space-y-1.5 mb-6">
      {met ? (
        <p className="text-xs font-medium" style={{ color: "var(--gold)" }}>
          🎉 You&rsquo;ve unlocked FREE shipping!
        </p>
      ) : (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Add <strong style={{ color: "var(--text)" }}>${amountToFree.toFixed(2)}</strong> more for FREE shipping
        </p>
      )}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: met ? "var(--gold)" : "var(--gold-light)",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span>${subtotalDollars.toFixed(2)}</span>
        <span>${FREE_SHIPPING_THRESHOLD_DOLLARS.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Single line item ───────────────────────────────────────────────────
function LineItem({
  item,
  onMinus,
  onPlus,
  onRemove,
}: {
  item: CartItem;
  onMinus: () => void;
  onPlus: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex gap-4">
      <div
        className="relative shrink-0 rounded-xl overflow-hidden"
        style={{ width: 80, height: 80, border: "1px solid var(--border)", background: "#fff" }}
      >
        <Image
          src={`/stickers/${item.sticker.filename}`}
          alt={item.sticker.name}
          fill
          className="object-contain p-1.5"
          sizes="80px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
          {item.sticker.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {item.sticker.isPack
            ? `${item.sticker.packSize}-sticker pack`
            : "Individual sticker"}
        </p>

        {/* Qty controls */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={onMinus}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
            aria-label="Decrease quantity"
          >
            <Minus size={11} />
          </button>
          <span
            className="text-xs font-medium tabular-nums min-w-[52px] text-center"
            style={{ color: "var(--text)" }}
          >
            Qty: {item.qty}
          </span>
          <button
            onClick={onPlus}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
            aria-label="Increase quantity"
          >
            <Plus size={11} />
          </button>
          <button
            onClick={onRemove}
            className="ml-1 flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
            style={{ color: "var(--text-muted)" }}
          >
            <Trash2 size={11} />
            Remove
          </button>
        </div>
      </div>

      <p className="text-sm font-medium tabular-nums shrink-0" style={{ color: "var(--text)" }}>
        ${(item.sticker.price * item.qty).toFixed(2)}
      </p>
    </li>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, setQty, remove } = useCart();

  const subtotalCents = items.reduce(
    (s, i) => s + Math.round(i.sticker.price * i.qty * 100),
    0
  );
  const subtotalDollars = subtotalCents / 100;

  const handleMinus = (item: CartItem) => {
    if (item.qty <= 1) { remove(item.sticker.id); return; }
    setQty(item.sticker.id, item.qty - 1);
  };

  const handleRemove = (id: string) => remove(id);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100svh" }}>
      {/* ── Header ── */}
      <header
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <Link
          href="/shop"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Back to shop</span>
        </Link>
        <span
          className="font-serif text-lg font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Desert Fathers Studio
        </span>
        <div className="w-28" />
      </header>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-10 lg:py-14">

        {/* Heading row */}
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Order Summary
          </h1>
          <Link
            href="/shop"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ← Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Your cart is empty.
            </p>
            <Link
              href="/shop"
              className="text-sm underline"
              style={{ color: "var(--brand)" }}
            >
              Browse stickers
            </Link>
          </div>
        ) : (
          <>
            {/* Line items */}
            <ul className="space-y-6 mb-8">
              {items.map((item) => (
                <LineItem
                  key={item.sticker.id}
                  item={item}
                  onMinus={() => handleMinus(item)}
                  onPlus={() => setQty(item.sticker.id, item.qty + 1)}
                  onRemove={() => handleRemove(item.sticker.id)}
                />
              ))}
            </ul>

            {/* Delivery estimate */}
            <div
              className="flex items-center gap-2 text-xs pb-6 mb-6"
              style={{
                borderBottom: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <Truck size={13} className="shrink-0" style={{ color: "var(--gold)" }} />
              <span>
                Ships in 2–3 business days · Arrives in 5–7 business days via USPS
              </span>
            </div>

            {/* Free-shipping progress */}
            <FreeShippingBar subtotalDollars={subtotalDollars} />

            {/* Totals */}
            <div className="space-y-2 mb-8">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                <span className="tabular-nums" style={{ color: "var(--text)" }}>
                  ${subtotalDollars.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span style={{ color: "var(--text-muted)" }}>Shipping</span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  $4–$6 · calculated at checkout
                </span>
              </div>
              <div
                className="flex justify-between items-baseline pt-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Total
                </span>
                <span
                  className="text-2xl font-bold tabular-nums font-serif"
                  style={{ color: "var(--text)" }}
                >
                  ${subtotalDollars.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Proceed button */}
            <button
              onClick={() => router.push("/checkout/details")}
              className="w-full py-4 text-base font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75"
              style={{
                background: "var(--brand)",
                color: "#fff",
                borderRadius: "var(--radius-btn)",
                minHeight: 52,
              }}
            >
              Proceed to Checkout →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
