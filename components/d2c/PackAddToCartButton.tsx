"use client";

import { useCart } from "@/lib/cart";
import type { Sticker } from "@/lib/catalog";

export function PackAddToCartButton({ pack }: { pack: Sticker }) {
  const { add, openCart } = useCart();
  return (
    <button
      onClick={() => { add(pack); openCart(); }}
      className="inline-flex items-center gap-2 px-7 py-3.5 font-medium text-sm transition-opacity hover:opacity-85"
      style={{
        background: "var(--brand)",
        color: "var(--text-inverse)",
        borderRadius: "var(--radius-btn)",
        border: "none",
        cursor: "pointer",
      }}
    >
      Add to Cart
    </button>
  );
}
