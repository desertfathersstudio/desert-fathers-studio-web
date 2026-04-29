"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SESSION_KEY, CART_KEY_PREFIX } from "@/types/wholesale";
import type { WholesaleProduct, WholesaleCartLine, WholesaleSession } from "@/types/wholesale";
import { WholesaleHeader } from "@/components/wholesale/WholesaleHeader";
import { CatalogTab } from "@/components/wholesale/tabs/CatalogTab";
import { PendingTab } from "@/components/wholesale/tabs/PendingTab";
import { OrderTab } from "@/components/wholesale/tabs/OrderTab";
import { SuggestionsTab } from "@/components/wholesale/tabs/SuggestionsTab";
import { PreviousOrdersTab } from "@/components/wholesale/tabs/PreviousOrdersTab";

type Tab = "catalog" | "pending" | "order" | "suggestions" | "orders";

function loadCart(accountId: string): WholesaleCartLine[] {
  try {
    const raw = sessionStorage.getItem(`${CART_KEY_PREFIX}${accountId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(accountId: string, cart: WholesaleCartLine[]) {
  try {
    sessionStorage.setItem(`${CART_KEY_PREFIX}${accountId}`, JSON.stringify(cart));
  } catch {}
}

export default function WholesaleDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<WholesaleSession | null>(null);
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCartRaw] = useState<WholesaleCartLine[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("catalog");
  const [lastModified, setLastModified] = useState("");
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const sessionRef = useRef<WholesaleSession | null>(null);

  // Auth check on mount
  useEffect(() => {
    let parsed: WholesaleSession | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch {}

    if (!parsed) {
      router.replace("/wholesale-portal");
      return;
    }

    sessionRef.current = parsed;
    setSession(parsed);
    setCartRaw(loadCart(parsed.accountId));
  }, [router]);

  // Load products after session resolves
  useEffect(() => {
    if (!session) return;
    setProductsLoading(true);
    fetch(`/api/wholesale/products?accountId=${session.accountId}`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));

    fetch("/api/wholesale/last-modified")
      .then((r) => r.json())
      .then((d) => setLastModified(d.lastModified ?? ""))
      .catch(() => {});
  }, [session]);

  const setCart = useCallback(
    (updater: WholesaleCartLine[] | ((prev: WholesaleCartLine[]) => WholesaleCartLine[])) => {
      setCartRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const accountId = sessionRef.current?.accountId;
        if (accountId) saveCart(accountId, next);
        return next;
      });
    },
    [],
  );

  const handleAddToCart = useCallback(
    (line: WholesaleCartLine) => {
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.productId === line.productId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], qty: updated[idx].qty + line.qty };
          return updated;
        }
        return [...prev, line];
      });
    },
    [setCart],
  );

  const handleProductApproved = useCallback((productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, reviewStatus: "approved" as const } : p)),
    );
  }, []);

  const handleProductUnapproved = useCallback((productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, reviewStatus: "under_review" as const } : p,
      ),
    );
  }, []);

  const handleProductsUpdated = useCallback((updated: WholesaleProduct[]) => {
    setProducts(updated);
  }, []);

  const handleOrderSubmitted = useCallback(() => {
    setCart([]);
    setOrdersRefreshKey((k) => k + 1);
    setActiveTab("orders");
  }, [setCart]);

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--border)",
            borderTopColor: "var(--brand)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <WholesaleHeader
        session={session}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={cartCount}
        lastModified={lastModified}
      />

      <main>
        {activeTab === "catalog" && (
          productsLoading ? (
            <LoadingSpinner />
          ) : (
            <CatalogTab
              products={products}
              onAddToCart={handleAddToCart}
              accountId={session.accountId}
              hasPendingTab={session.hasPendingTab}
              onProductUnapproved={handleProductUnapproved}
            />
          )
        )}

        {activeTab === "pending" && session.hasPendingTab && (
          productsLoading ? (
            <LoadingSpinner />
          ) : (
            <PendingTab
              products={products}
              onProductApproved={handleProductApproved}
              onProductsUpdated={handleProductsUpdated}
              accountId={session.accountId}
            />
          )
        )}

        {activeTab === "order" && (
          <OrderTab
            products={products}
            cart={cart}
            onCartChange={setCart}
            session={session}
            onOrderSubmitted={handleOrderSubmitted}
          />
        )}

        {activeTab === "suggestions" && (
          <SuggestionsTab products={products} accountId={session.accountId} />
        )}

        {activeTab === "orders" && (
          <PreviousOrdersTab
            accountId={session.accountId}
            canEditFulfillment={session.canEditFulfillment}
            refreshKey={ordersRefreshKey}
          />
        )}
      </main>

      {/* Floating cart FAB — visible when cart has items and user isn't already on Order tab */}
      {cartCount > 0 && activeTab !== "order" && (
        <button
          onClick={() => setActiveTab("order")}
          aria-label={`View order — ${cartCount} item${cartCount !== 1 ? "s" : ""} in cart`}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.25rem",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "0.75rem 1.25rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            fontFamily: "var(--font-inter)",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(107,31,42,0.35)",
          }}
        >
          <CartIcon />
          {cartCount} item{cartCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid var(--border)",
          borderTopColor: "var(--brand)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
