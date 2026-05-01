"use client";

import { useState, useCallback, useRef } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";
import type {
  StripeAddressElementChangeEvent,
  StripePaymentElementChangeEvent,
} from "@stripe/stripe-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus, Plus, Trash2, Loader2, Package,
  Lock, MapPin, RotateCcw, Truck, ChevronDown,
} from "lucide-react";
import { FREE_SHIPPING_THRESHOLD_DOLLARS } from "@/lib/shipping";
import { useCart } from "@/lib/cart";
import type { CartItem } from "@/lib/cart";

interface AddressRequest {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ── Input helper (reused for email / phone) ────────────────────────────
function FieldInput({
  id, label, type = "text", value, onChange, placeholder, required, hint,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}{required && " *"}
      </label>
      <input
        id={id} type={type} autoComplete={id} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm outline-none transition-all"
        style={{
          border: "1px solid var(--border)", background: "var(--bg)",
          color: "var(--text)", borderRadius: "var(--radius-btn)", minHeight: 44,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      {hint && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

// ── Shipping display ───────────────────────────────────────────────────
function ShippingValue({
  shippingCents, isFreeShipping, isUpdating,
}: { shippingCents: number | null; isFreeShipping: boolean; isUpdating: boolean }) {
  if (isUpdating) return <Loader2 size={13} className="animate-spin" style={{ color: "var(--text-muted)" }} />;
  if (shippingCents === null)
    return <span className="text-xs italic tabular-nums" style={{ color: "var(--text-muted)" }}>$4–$6 · calculated at checkout</span>;
  if (isFreeShipping)
    return <span className="font-semibold" style={{ color: "var(--gold)" }}>FREE</span>;
  return <span className="tabular-nums" style={{ color: "var(--text)" }}>${(shippingCents / 100).toFixed(2)}</span>;
}

// ── Free-shipping progress bar ─────────────────────────────────────────
function FreeShippingBar({ subtotalDollars }: { subtotalDollars: number }) {
  const pct = Math.min((subtotalDollars / FREE_SHIPPING_THRESHOLD_DOLLARS) * 100, 100);
  const amountToFree = Math.max(FREE_SHIPPING_THRESHOLD_DOLLARS - subtotalDollars, 0);
  const met = subtotalDollars >= FREE_SHIPPING_THRESHOLD_DOLLARS;

  return (
    <div className="mb-6 space-y-1.5">
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
          style={{ width: `${pct}%`, background: met ? "var(--gold)" : "var(--gold-light)" }}
        />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span>${subtotalDollars.toFixed(2)}</span>
        <span>${FREE_SHIPPING_THRESHOLD_DOLLARS.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────
export function CheckoutForm({ paymentIntentId }: { paymentIntentId: string }) {
  const { items, setQty, remove } = useCart();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  // Contact
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Extras
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Form validity
  const [addressComplete, setAddressComplete] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  // Amounts
  const [shippingCents, setShippingCents] = useState<number | null>(null);
  const [totalCents, setTotalCents] = useState<number | null>(null);
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  // Status
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Refs — always fresh, safe to use in callbacks/timeouts
  const emailRef = useRef("");
  const notesRef = useRef("");
  const lastAddressRef = useRef<AddressRequest | null>(null);
  const lastNameRef = useRef<string>("");
  const itemsRef = useRef<CartItem[]>(items);
  const pendingItemsRef = useRef<CartItem[]>([]);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qtyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync on every render (no useEffect needed)
  emailRef.current = email;
  notesRef.current = notes;
  itemsRef.current = items;

  // Computed values
  const subtotalCents = items.reduce((s, i) => s + Math.round(i.sticker.price * i.qty * 100), 0);
  const subtotalDollars = subtotalCents / 100;
  const displayTotal = totalCents ?? subtotalCents;

  const emailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const formReady = emailValid && addressComplete && paymentReady && !isUpdating && !isSubmitting;

  // ── PI update ────────────────────────────────────────────────────────
  const callUpdatePI = useCallback(async (
    currentItems: CartItem[],
    address: AddressRequest,
    name: string,
  ) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          items: currentItems.map((i) => ({ product_id: i.sticker.id, quantity: i.qty })),
          address,
          customerName: name,
          customerEmail: emailRef.current,
          notes: notesRef.current.slice(0, 500),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAddressError(data.error);
      } else {
        setAddressError(null);
        setShippingCents(data.shippingCents);
        setTotalCents(data.totalCents);
        setIsFreeShipping(data.isFreeShipping);
      }
    } catch {
      setAddressError("Could not calculate shipping. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [paymentIntentId]);

  // Debounced PI update after qty change
  const scheduleQtyUpdate = useCallback((newItems: CartItem[]) => {
    if (!lastAddressRef.current) return;
    pendingItemsRef.current = newItems;
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      if (lastAddressRef.current) {
        callUpdatePI(pendingItemsRef.current, lastAddressRef.current, lastNameRef.current);
      }
    }, 500);
  }, [callUpdatePI]);

  // ── Qty / Remove handlers ────────────────────────────────────────────
  const handleQtyMinus = (item: CartItem) => {
    if (item.qty <= 1) { handleRemove(item.sticker.id); return; }
    const newQty = item.qty - 1;
    setQty(item.sticker.id, newQty);
    scheduleQtyUpdate(items.map((i) => i.sticker.id === item.sticker.id ? { ...i, qty: newQty } : i));
  };

  const handleQtyPlus = (item: CartItem) => {
    const newQty = item.qty + 1;
    setQty(item.sticker.id, newQty);
    scheduleQtyUpdate(items.map((i) => i.sticker.id === item.sticker.id ? { ...i, qty: newQty } : i));
  };

  const handleRemove = (stickerId: string) => {
    const newItems = items.filter((i) => i.sticker.id !== stickerId);
    remove(stickerId);
    if (newItems.length === 0) { router.push("/shop"); return; }
    scheduleQtyUpdate(newItems);
  };

  // ── Address change ────────────────────────────────────────────────────
  const handleAddressChange = useCallback((event: StripeAddressElementChangeEvent) => {
    setAddressComplete(event.complete);
    if (!event.complete) return;

    const addr = event.value.address;
    const name = event.value.name;

    if (addr.country !== "US") {
      setAddressError("We currently only ship within the United States.");
      return;
    }
    setAddressError(null);

    const addressReq: AddressRequest = {
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: "US",
    };

    lastAddressRef.current = addressReq;
    lastNameRef.current = name;

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(() => {
      callUpdatePI(itemsRef.current, addressReq, name);
    }, 600);
  }, [callUpdatePI]);

  // ── Payment element change ────────────────────────────────────────────
  const handlePaymentChange = useCallback((event: StripePaymentElementChangeEvent) => {
    setPaymentReady(event.complete);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || !formReady) return;

    setPaymentError(null);
    setIsSubmitting(true);

    // Sync final notes to PI metadata before charging
    if (lastAddressRef.current) {
      try {
        await fetch("/api/create-payment-intent", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId,
            items: items.map((i) => ({ product_id: i.sticker.id, quantity: i.qty })),
            address: lastAddressRef.current,
            customerName: lastNameRef.current,
            customerEmail: email,
            notes: notes.trim(),
          }),
        });
      } catch { /* non-fatal — notes may not be saved */ }
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        receipt_email: email || undefined,
      },
    });

    // Only reaches here on error (success causes a redirect)
    if (error) {
      setPaymentError(error.message ?? "Payment failed. Please check your details and try again.");
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_440px]"
        style={{ minHeight: "calc(100svh - 57px)", background: "var(--bg)" }}
      >

        {/* ════════════════════════════════════════════
            LEFT COLUMN — Order summary
            On mobile: first (top). On desktop: first (left).
        ════════════════════════════════════════════ */}
        <div
          className="px-6 py-8 lg:px-12 lg:py-12"
          style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}
        >
          {/* Continue shopping */}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs mb-6 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ← Continue shopping
          </Link>

          <h2 className="font-serif text-xl font-semibold mb-6" style={{ color: "var(--text)" }}>
            Order Summary
          </h2>

          {/* Line items */}
          <ul className="space-y-5 mb-6">
            {items.map((item) => (
              <li key={item.sticker.id} className="flex gap-4">
                {/* Thumbnail — 80px */}
                <div
                  className="relative shrink-0 rounded-lg overflow-hidden"
                  style={{
                    width: 80, height: 80,
                    border: "1px solid var(--border)", background: "#fff",
                  }}
                >
                  <Image
                    src={`/stickers/${item.sticker.filename}`}
                    alt={item.sticker.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate" style={{ color: "var(--text)" }}>
                    {item.sticker.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.sticker.isPack ? `${item.sticker.packSize}-sticker pack` : "Individual sticker"}
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleQtyMinus(item)}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-medium tabular-nums w-12 text-center" style={{ color: "var(--text)" }}>
                      Qty: {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyPlus(item)}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.sticker.id)}
                      className="ml-1 flex items-center gap-0.5 text-xs transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-muted)" }}
                      aria-label={`Remove ${item.sticker.name}`}
                    >
                      <Trash2 size={11} />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Line price */}
                <p className="text-sm font-medium shrink-0 tabular-nums" style={{ color: "var(--text)" }}>
                  ${(item.sticker.price * item.qty).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>

          {/* Delivery estimate */}
          <div
            className="flex items-center gap-2 text-xs mb-5 pb-5"
            style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <Truck size={13} className="shrink-0" style={{ color: "var(--gold)" }} />
            <span>Ships in 2–3 business days · Arrives in 5–7 business days via USPS</span>
          </div>

          {/* Free shipping progress bar */}
          <FreeShippingBar subtotalDollars={subtotalDollars} />

          {/* Totals */}
          <div style={{ borderTop: "1px solid var(--border)" }} className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span className="tabular-nums" style={{ color: "var(--text)" }}>
                ${subtotalDollars.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span style={{ color: "var(--text-muted)" }}>Shipping</span>
              <ShippingValue
                shippingCents={shippingCents}
                isFreeShipping={isFreeShipping}
                isUpdating={isUpdating}
              />
            </div>

            {/* Total — visually prominent */}
            <div
              className="flex justify-between items-baseline pt-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Total</span>
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: "var(--text)", fontFamily: "var(--font-serif)" }}
              >
                ${(displayTotal / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT COLUMN — Payment form
            On mobile: second (below). On desktop: second (right).
        ════════════════════════════════════════════ */}
        <div
          className="px-6 py-8 lg:px-10 lg:py-12 flex flex-col gap-7"
          style={{ background: "var(--bg)" }}
        >
          {/* ── Contact ── */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--text)" }}>
              Contact
            </h2>
            <FieldInput
              id="email" label="Email" type="email" required
              value={email} onChange={setEmail}
              placeholder="you@example.com"
            />
            <FieldInput
              id="phone" label="Phone (optional)" type="tel"
              value={phone} onChange={setPhone}
              placeholder="+1 (555) 000-0000"
              hint="For delivery updates only"
            />
          </section>

          {/* ── Shipping Address ── */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--text)" }}>
              Shipping Address
            </h2>
            <AddressElement
              options={{
                mode: "shipping",
                allowedCountries: ["US"],
                fields: { phone: "never" },
              }}
              onChange={handleAddressChange}
            />
            {addressError && (
              <p className="text-sm mt-1" style={{ color: "#c0392b" }}>{addressError}</p>
            )}
          </section>

          {/* ── Payment ── */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--text)" }}>
              Payment
            </h2>
            <PaymentElement options={{ layout: "tabs" }} onChange={handlePaymentChange} />
          </section>

          {/* ── Order Notes (collapsible) ── */}
          <section>
            {showNotes ? (
              <div className="space-y-1.5">
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Order Note
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, prayer requests, or gift messages…"
                  className="w-full px-3 py-2.5 text-sm resize-none outline-none transition-all"
                  style={{
                    border: "1px solid var(--border)", background: "var(--bg)",
                    color: "var(--text)", borderRadius: "var(--radius-btn)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronDown size={14} />
                Add a note (optional)
              </button>
            )}
          </section>

          {/* ── Promo Code (collapsible) ── */}
          <section>
            {showPromo ? (
              <div className="space-y-2">
                <label
                  htmlFor="promo"
                  className="block text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo"
                    type="text"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2.5 text-sm outline-none transition-all"
                    style={{
                      border: "1px solid var(--border)", background: "var(--bg)",
                      color: "var(--text)", borderRadius: "var(--radius-btn)", minHeight: 44,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                  <button
                    type="button"
                    onClick={() => setPromoApplied(true)}
                    disabled={!promoCode.trim()}
                    className="px-4 text-sm font-medium transition-opacity disabled:opacity-40"
                    style={{
                      border: "1px solid var(--border)", borderRadius: "var(--radius-btn)",
                      background: "var(--bg)", color: "var(--text)", minHeight: 44,
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && promoCode.trim() && (
                  <p className="text-xs" style={{ color: "#c0392b" }}>
                    This code is not valid.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPromo(true)}
                className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronDown size={14} />
                Have a promo code?
              </button>
            )}
          </section>

          {/* ── Payment error ── */}
          {paymentError && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(192,57,43,0.07)",
                border: "1px solid rgba(192,57,43,0.25)",
                color: "#c0392b",
              }}
            >
              {paymentError}
            </div>
          )}

          {/* ── Submit button ── */}
          <div className="space-y-2">
            <button
              type="submit"
              disabled={!formReady}
              className="w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: formReady ? "var(--brand)" : "var(--border-dark)",
                color: formReady ? "#fff" : "var(--text-muted)",
                borderRadius: "var(--radius-btn)",
                cursor: formReady ? "pointer" : "not-allowed",
                minHeight: 52,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Package size={16} />
                  Place Order — ${(displayTotal / 100).toFixed(2)}
                </>
              )}
            </button>

            {/* Helper text when disabled */}
            {!formReady && !isSubmitting && (
              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                {!emailValid
                  ? "Enter a valid email to continue"
                  : !addressComplete
                  ? "Complete your shipping address to continue"
                  : !paymentReady
                  ? "Complete your payment details to continue"
                  : isUpdating
                  ? "Calculating shipping…"
                  : "Complete your information to continue"}
              </p>
            )}
          </div>

          {/* ── Trust signals ── */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="flex items-center gap-1.5 text-xs">
              <Lock size={11} />
              SSL Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <MapPin size={11} />
              Ships from North Carolina
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <RotateCcw size={11} />
              30-day returns
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
