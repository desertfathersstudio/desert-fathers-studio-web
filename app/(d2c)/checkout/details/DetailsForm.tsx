"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Lock, MapPin, RotateCcw, ArrowRight, ChevronDown, Truck,
} from "lucide-react";
import { FREE_SHIPPING_THRESHOLD_DOLLARS } from "@/lib/shipping";
import { useCart } from "@/lib/cart";

// ── US states ──────────────────────────────────────────────────────────
const US_STATES: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],
  ["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],
  ["WI","Wisconsin"],["WY","Wyoming"],["DC","Washington DC"],
];

// ── Shared styles ──────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  borderRadius: "var(--radius-btn)",
  minHeight: 44,
};
const inputError: React.CSSProperties = { ...inputBase, border: "1px solid #c0392b" };

function labelEl(text: string, required?: boolean) {
  return (
    <span
      className="block text-[11px] font-medium uppercase tracking-wide mb-1"
      style={{ color: "var(--text-muted)" }}
    >
      {text}{required && " *"}
    </span>
  );
}

function Field({
  id, label, type = "text", value, onChange, onBlur,
  placeholder, required, hint, error, autoComplete,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; required?: boolean; hint?: string;
  error?: string; autoComplete?: string;
}) {
  const hasError = Boolean(error);
  return (
    <div>
      {labelEl(label, required)}
      <input
        id={id} type={type}
        autoComplete={autoComplete ?? id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError ? "#c0392b" : "var(--border)";
          onBlur?.();
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError ? "#c0392b" : "var(--brand)";
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm outline-none transition-colors"
        style={hasError ? inputError : inputBase}
      />
      {hasError && <p className="text-xs mt-1" style={{ color: "#c0392b" }}>{error}</p>}
      {!hasError && hint && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

function StateSelect({ value, onChange, onBlur, error }: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string;
}) {
  const hasError = Boolean(error);
  return (
    <div>
      {labelEl("State", true)}
      <select
        autoComplete="address-level1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError ? "#c0392b" : "var(--border)";
          onBlur?.();
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError ? "#c0392b" : "var(--brand)";
        }}
        className="w-full px-3 py-2.5 text-sm outline-none transition-colors appearance-none"
        style={hasError ? inputError : inputBase}
      >
        <option value="">State</option>
        {US_STATES.map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      {hasError && <p className="text-xs mt-1" style={{ color: "#c0392b" }}>{error}</p>}
    </div>
  );
}

function FreeShippingBar({ subtotalDollars }: { subtotalDollars: number }) {
  const pct = Math.min((subtotalDollars / FREE_SHIPPING_THRESHOLD_DOLLARS) * 100, 100);
  const amountToFree = Math.max(FREE_SHIPPING_THRESHOLD_DOLLARS - subtotalDollars, 0);
  const met = subtotalDollars >= FREE_SHIPPING_THRESHOLD_DOLLARS;
  return (
    <div className="space-y-1 mb-5">
      {met ? (
        <p className="text-[11px] font-medium" style={{ color: "var(--gold)" }}>
          🎉 Free shipping unlocked!
        </p>
      ) : (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Add <strong style={{ color: "var(--text)" }}>${amountToFree.toFixed(2)}</strong> more for free shipping
        </p>
      )}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: met ? "var(--gold)" : "var(--gold-light)" }}
        />
      </div>
    </div>
  );
}

// ── Session persistence ────────────────────────────────────────────────
const FIELDS_KEY = "dfs-checkout-fields";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zipRe   = /^\d{5}$/;

interface SavedFields {
  firstName: string; lastName: string; email: string; phone: string; notes: string;
  addrLine1: string; addrLine2: string; addrCity: string; addrState: string; addrZip: string;
}

// ── Main form ──────────────────────────────────────────────────────────
export function DetailsForm() {
  const { items } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");

  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity,  setAddrCity]  = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip,   setAddrZip]   = useState("");

  const [notes,         setNotes]         = useState("");
  const [showNotes,     setShowNotes]     = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [touched,     setTouched]     = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  const touch = (f: string) => setTouched((p) => new Set(p).add(f));

  // Restore saved fields from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FIELDS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<SavedFields>;
      if (s.firstName) setFirstName(s.firstName);
      if (s.lastName)  setLastName(s.lastName);
      if (s.email)     setEmail(s.email);
      if (s.phone)     setPhone(s.phone);
      if (s.notes)   { setNotes(s.notes); setShowNotes(true); }
      if (s.addrLine1) setAddrLine1(s.addrLine1);
      if (s.addrLine2) setAddrLine2(s.addrLine2);
      if (s.addrCity)  setAddrCity(s.addrCity);
      if (s.addrState) setAddrState(s.addrState);
      if (s.addrZip)   setAddrZip(s.addrZip);
    } catch { /* ignore */ }
  }, []);

  // Persist to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(FIELDS_KEY, JSON.stringify({
        firstName, lastName, email, phone, notes,
        addrLine1, addrLine2, addrCity, addrState, addrZip,
      }));
    } catch { /* ignore */ }
  }, [firstName, lastName, email, phone, notes, addrLine1, addrLine2, addrCity, addrState, addrZip]);

  // ── Derived ────────────────────────────────────────────────────────
  const subtotalCents   = items.reduce((s, i) => s + Math.round(i.sticker.price * i.qty * 100), 0);
  const subtotalDollars = subtotalCents / 100;
  const emailValid      = email.trim().length > 0 && emailRe.test(email.trim());
  const addressComplete =
    addrLine1.trim().length > 0 &&
    addrCity.trim().length  > 0 &&
    addrState.length === 2  &&
    zipRe.test(addrZip.trim());
  const formReady =
    firstName.trim().length > 0 && lastName.trim().length > 0 &&
    emailValid && addressComplete && !isSubmitting;

  // ── Validation errors (after touch) ───────────────────────────────
  const firstNameError = touched.has("firstName") && !firstName.trim() ? "Required" : undefined;
  const lastNameError  = touched.has("lastName")  && !lastName.trim()  ? "Required" : undefined;
  const emailError     = touched.has("email") && !emailValid ? "Enter a valid email" : undefined;
  const line1Error     = touched.has("addrLine1") && !addrLine1.trim() ? "Required" : undefined;
  const cityError      = touched.has("addrCity")  && !addrCity.trim()  ? "Required" : undefined;
  const stateError     = touched.has("addrState") && !addrState        ? "Required" : undefined;
  const zipError       = touched.has("addrZip") && !zipRe.test(addrZip.trim())
    ? "Enter a 5-digit ZIP" : undefined;

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(new Set(["firstName", "lastName", "email", "addrLine1", "addrCity", "addrState", "addrZip"]));
    if (!formReady) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.sticker.id, quantity: i.qty })),
          customerInfo: {
            firstName: firstName.trim(),
            lastName:  lastName.trim(),
            email:     email.trim(),
            phone:     phone.trim() || undefined,
            notes:     notes.trim() || undefined,
            marketingOptIn,
            address: {
              line1:       addrLine1.trim(),
              line2:       addrLine2.trim() || undefined,
              city:        addrCity.trim(),
              state:       addrState,
              postal_code: addrZip.trim(),
              country:     "US",
            },
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        setSubmitError(data.error);
        setIsSubmitting(false);
        return;
      }

      // Clear PI cache before handing off to Stripe
      try { sessionStorage.removeItem("dfs-pi-cache-v3"); } catch { /* ignore */ }

      window.location.href = data.url;
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      <div className="lg:grid lg:grid-cols-[340px_1fr]" style={{ minHeight: "calc(100svh - 57px)" }}>

        {/* ══ LEFT — Order recap ══ */}
        <aside
          className="px-6 py-8 lg:px-8 lg:py-10 lg:sticky lg:top-[57px] lg:self-start"
          style={{
            background: "var(--bg-card)",
            borderRight: "1px solid var(--border)",
            maxHeight: "calc(100svh - 57px)",
            overflowY: "auto",
          }}
        >
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--text)" }}>
              Your Order
            </h2>
            <Link href="/checkout" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              Edit cart
            </Link>
          </div>

          <ul className="space-y-4 mb-5">
            {items.map((item) => (
              <li key={item.sticker.id} className="flex gap-3 items-start">
                <div
                  className="relative shrink-0 rounded-lg overflow-hidden"
                  style={{ width: 56, height: 56, border: "1px solid var(--border)", background: "#fff" }}
                >
                  <Image
                    src={`/stickers/${item.sticker.filename}`}
                    alt={item.sticker.name}
                    fill className="object-contain p-1" sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug truncate" style={{ color: "var(--text)" }}>
                    {item.sticker.name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Qty: {item.qty}
                  </p>
                </div>
                <p className="text-xs font-medium tabular-nums shrink-0" style={{ color: "var(--text)" }}>
                  ${(item.sticker.price * item.qty).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>

          <div
            className="flex items-center gap-2 text-[11px] pb-5 mb-5"
            style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <Truck size={11} className="shrink-0" style={{ color: "var(--gold)" }} />
            <span>Ships 2–3 days · Arrives 5–7 days via USPS</span>
          </div>

          <FreeShippingBar subtotalDollars={subtotalDollars} />

          <div className="space-y-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span className="tabular-nums" style={{ color: "var(--text)" }}>
                ${subtotalDollars.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Shipping</span>
              <span className="italic text-[11px]" style={{ color: "var(--text-muted)" }}>
                Calculated at checkout
              </span>
            </div>
          </div>
        </aside>

        {/* ══ RIGHT — Form ══ */}
        <div className="px-6 py-8 lg:px-10 lg:py-10 flex flex-col gap-8" style={{ background: "var(--bg)" }}>

          {/* ── Contact ── */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--text)" }}>Contact</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field id="firstName" label="First Name" required autoComplete="given-name"
                value={firstName} onChange={setFirstName} onBlur={() => touch("firstName")} error={firstNameError} />
              <Field id="lastName"  label="Last Name"  required autoComplete="family-name"
                value={lastName}  onChange={setLastName}  onBlur={() => touch("lastName")}  error={lastNameError}  />
            </div>
            <Field id="email" label="Email" type="email" required autoComplete="email"
              value={email} onChange={setEmail} onBlur={() => touch("email")}
              placeholder="you@example.com" error={emailError} />
            <Field id="phone" label="Phone" type="tel" autoComplete="tel"
              value={phone} onChange={setPhone}
              placeholder="+1 (555) 000-0000" hint="Optional · for delivery updates only" />
          </section>

          {/* ── Shipping Address ── */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--text)" }}>Shipping Address</h2>

            <Field id="addrLine1" label="Address" required autoComplete="address-line1"
              value={addrLine1} onChange={setAddrLine1} onBlur={() => touch("addrLine1")}
              placeholder="123 Main St" error={line1Error} />

            <Field id="addrLine2" label="Apartment, suite, etc." autoComplete="address-line2"
              value={addrLine2} onChange={setAddrLine2} placeholder="Apt 4B (optional)" />

            <Field id="addrCity" label="City" required autoComplete="address-level2"
              value={addrCity} onChange={setAddrCity} onBlur={() => touch("addrCity")} error={cityError} />

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <StateSelect value={addrState} onChange={setAddrState} onBlur={() => touch("addrState")} error={stateError} />
              <Field id="addrZip" label="ZIP" required autoComplete="postal-code"
                value={addrZip} onChange={setAddrZip} onBlur={() => touch("addrZip")}
                placeholder="27601" error={zipError} />
            </div>

            <div>
              {labelEl("Country")}
              <div
                className="w-full px-3 py-2.5 text-sm"
                style={{ ...inputBase, color: "var(--text-muted)", userSelect: "none" }}
              >
                United States
              </div>
            </div>
          </section>

          {/* ── Notes ── */}
          <section>
            {showNotes ? (
              <div>
                {labelEl("Order Note")}
                <textarea
                  id="notes" rows={3} value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, prayer requests, or gift messages…"
                  className="w-full px-3 py-2.5 text-sm resize-none outline-none transition-colors"
                  style={{ ...inputBase }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
            ) : (
              <button type="button" onClick={() => setShowNotes(true)}
                className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}>
                <ChevronDown size={14} />
                Add a note (optional)
              </button>
            )}
          </section>

          {/* ── Marketing opt-in ── */}
          <section>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0"
                style={{ accentColor: "var(--brand)" }}
              />
              <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Send me occasional updates about new icons, stickers, and sales. You can unsubscribe anytime.
              </span>
            </label>
          </section>

          {/* ── Submit error ── */}
          {submitError && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{
              background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)", color: "#c0392b",
            }}>
              {submitError}
            </div>
          )}

          {/* ── Submit ── */}
          <div className="space-y-2 pb-10">
            <button
              type="submit" disabled={!formReady}
              className="w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background:    formReady ? "var(--brand)" : "var(--border-dark)",
                color:         formReady ? "#fff" : "var(--text-muted)",
                borderRadius:  "var(--radius-btn)",
                cursor:        formReady ? "pointer" : "not-allowed",
                opacity:       formReady ? 1 : 0.7,
                minHeight:     52,
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Redirecting to payment…</>
              ) : (
                <>Continue to Payment <ArrowRight size={16} /></>
              )}
            </button>

            {!formReady && !isSubmitting && (
              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                {!firstName.trim() || !lastName.trim()
                  ? "Enter your name to continue"
                  : !emailValid
                  ? "Enter a valid email to continue"
                  : !addressComplete
                  ? "Complete your shipping address to continue"
                  : "Complete all fields to continue"}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5 text-[11px]"><Lock size={10} /> SSL Encrypted</span>
              <span className="flex items-center gap-1.5 text-[11px]"><MapPin size={10} /> Ships from NC</span>
              <span className="flex items-center gap-1.5 text-[11px]"><RotateCcw size={10} /> 30-day returns</span>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
