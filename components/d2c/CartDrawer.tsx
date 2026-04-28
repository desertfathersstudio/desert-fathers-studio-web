"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartDrawer() {
  const { items, isOpen, closeCart, remove, setQty, count, total } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(28,42,58,0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            className="fixed top-0 right-0 z-50 h-full w-full flex flex-col"
            style={{
              maxWidth: 400,
              background: "var(--bg)",
              borderLeft: "1px solid var(--border)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            aria-label="Shopping cart"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.35rem",
                  fontWeight: 400,
                  color: "var(--text)",
                }}
              >
                Your Cart{" "}
                {count > 0 && (
                  <em
                    style={{ color: "var(--gold)", fontStyle: "italic", fontSize: "1.1rem" }}
                  >
                    ({count})
                  </em>
                )}
              </h2>
              <button
                onClick={closeCart}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-60"
                aria-label="Close cart"
              >
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-16">
                  <ShoppingBag size={44} strokeWidth={1.2} style={{ color: "var(--border)" }} />
                  <div>
                    <h3
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "1.35rem",
                        fontWeight: 400,
                        color: "var(--text)",
                      }}
                    >
                      Your cart is empty
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "26ch", margin: "0 auto" }}>
                      Add something meaningful — for your Bible, laptop, or a gift.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="inline-flex px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
                    style={{
                      background: "var(--brand)",
                      color: "#fff",
                      borderRadius: "var(--radius-btn)",
                    }}
                  >
                    Browse stickers
                  </Link>
                </div>
              ) : (
                <ul className="space-y-1" aria-live="polite" aria-label="Cart items">
                  {items.map(({ sticker, qty }) => (
                    <li
                      key={sticker.id}
                      className="flex gap-4 py-4"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      {/* Thumbnail */}
                      <div
                        className="shrink-0 w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{
                          background: "#fff",
                          border: "1px solid var(--border)",
                          padding: 6,
                        }}
                      >
                        <Image
                          src={`/stickers/${sticker.filename}`}
                          alt={sticker.name}
                          width={52}
                          height={52}
                          className="object-contain w-full h-full"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className="leading-snug mb-2"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "0.95rem",
                            color: "var(--text)",
                          }}
                        >
                          {sticker.name}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setQty(sticker.id, qty - 1)}
                            className="flex items-center justify-center w-6 h-6 text-sm rounded transition-opacity hover:opacity-70"
                            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 1) setQty(sticker.id, Math.min(v, 99));
                            }}
                            className="text-center text-xs font-medium"
                            style={{
                              width: 36,
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "3px 2px",
                              background: "var(--bg)",
                              color: "var(--text)",
                              fontVariantNumeric: "tabular-nums",
                              outline: "none",
                            }}
                            aria-label="Quantity"
                          />
                          <button
                            onClick={() => setQty(sticker.id, qty + 1)}
                            className="flex items-center justify-center w-6 h-6 text-sm rounded transition-opacity hover:opacity-70"
                            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                          <span
                            className="ml-1 text-xs"
                            style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
                          >
                            ${(sticker.price * qty).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => remove(sticker.id)}
                        className="shrink-0 flex items-center justify-center w-7 h-7 transition-opacity hover:opacity-60"
                        aria-label={`Remove ${sticker.name} from cart`}
                      >
                        <Trash2 size={14} style={{ color: "var(--text-muted)" }} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                className="px-6 py-5 shrink-0"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Subtotal
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>
                <button
                  className="w-full py-3 text-sm font-medium opacity-50 cursor-not-allowed"
                  style={{
                    background: "var(--brand)",
                    color: "#fff",
                    borderRadius: "var(--radius-btn)",
                  }}
                  disabled
                  aria-disabled="true"
                >
                  Proceed to Checkout
                </button>
                <p
                  className="mt-2 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Checkout coming soon
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
