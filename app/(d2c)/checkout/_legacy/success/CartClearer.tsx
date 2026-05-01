// LEGACY — Cart clearer for PI-based success page (replaced 2026-05-01)
"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

// Runs once client-side to clear the cart after a confirmed payment.
// Kept as a tiny client component so the success page can stay a server component.
export function CartClearer() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    // Also nuke the PI cache so a fresh cart gets a fresh PI
    try { sessionStorage.removeItem("dfs-pi-cache"); } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
