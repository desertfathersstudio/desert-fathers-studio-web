// LEGACY — Embedded Stripe PaymentElement checkout (replaced 2026-05-01)
// Replaced by Stripe hosted Checkout (redirect) flow.
// Kept here as a fallback; move back to /checkout/details/ to re-enable.
"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { DetailsForm } from "./DetailsForm";
import type { CartItemRequest } from "@/app/api/create-payment-intent/route";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#6B1F2A",
    colorBackground: "#F8F4EC",
    colorText: "#2a1a0e",
    colorDanger: "#c0392b",
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    borderRadius: "6px",
    colorTextPlaceholder: "#7a6a5a",
    colorIconTab: "#7a6a5a",
    colorIconTabSelected: "#6B1F2A",
    colorTextSecondary: "#7a6a5a",
  },
  rules: {
    ".Input": {
      border: "1px solid #e4d8c8",
      backgroundColor: "#F8F4EC",
      boxShadow: "none",
      color: "#2a1a0e",
    },
    ".Input:focus": {
      border: "1px solid #6B1F2A",
      outline: "none",
      boxShadow: "none",
    },
    ".Label": {
      color: "#7a6a5a",
      fontWeight: "500",
      textTransform: "uppercase" as const,
      fontSize: "11px",
      letterSpacing: "0.05em",
    },
    ".Tab": {
      border: "1px solid #e4d8c8",
      backgroundColor: "#F8F4EC",
      boxShadow: "none",
    },
    ".Tab:hover": {
      border: "1px solid #c8b89a",
    },
    ".Tab--selected": {
      border: "1px solid #6B1F2A",
      backgroundColor: "#F8F4EC",
    },
    ".Tab--selected:focus": {
      boxShadow: "none",
    },
  },
};

const STRIPE_FONTS = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap",
  },
];

const PI_CACHE_KEY = "dfs-pi-cache-v3";

interface CachedPI {
  piId: string;
  clientSecret: string;
  cartHash: string;
}

function computeCartHash(items: Array<{ id: string; qty: number }>) {
  return JSON.stringify([...items].sort((a, b) => a.id.localeCompare(b.id)));
}

export default function DetailsPage() {
  const { items } = useCart();
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/checkout");
      return;
    }

    const hash = computeCartHash(items.map((i) => ({ id: i.sticker.id, qty: i.qty })));

    // Return cached PI if cart hasn't changed
    try {
      const raw = sessionStorage.getItem(PI_CACHE_KEY);
      if (raw) {
        const cached: CachedPI = JSON.parse(raw);
        if (cached.cartHash === hash && cached.clientSecret) {
          setClientSecret(cached.clientSecret);
          setPaymentIntentId(cached.piId);
          return;
        }
      }
    } catch {
      // sessionStorage unavailable — proceed to create
    }

    const requestItems: CartItemRequest[] = items.map((i) => ({
      product_id: i.sticker.id,
      quantity: i.qty,
    }));

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: requestItems }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        try {
          const cache: CachedPI = {
            piId: data.paymentIntentId,
            clientSecret: data.clientSecret,
            cartHash: hash,
          };
          sessionStorage.setItem(PI_CACHE_KEY, JSON.stringify(cache));
        } catch {
          // ignore
        }
      })
      .catch(() => setError("Could not initialize checkout. Please try again."));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: "var(--bg)" }}
      >
        <p className="text-sm" style={{ color: "#c0392b" }}>
          {error}
        </p>
        <Link href="/checkout" className="text-sm underline" style={{ color: "var(--brand)" }}>
          Return to cart
        </Link>
      </div>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100svh" }}>
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <Link
          href="/checkout"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          ← Cart
        </Link>
        <span
          className="font-serif text-lg font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Desert Fathers Studio
        </span>
        <div className="w-16" />
      </header>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: STRIPE_APPEARANCE,
          fonts: STRIPE_FONTS,
        }}
      >
        <DetailsForm paymentIntentId={paymentIntentId} />
      </Elements>
    </div>
  );
}
