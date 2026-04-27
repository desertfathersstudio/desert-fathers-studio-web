"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { useCart } from "@/lib/cart";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/catalog";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=packs", label: "Packs" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "#story", label: "About" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => {
    setMobileOpen(false);
    setStickersOpen(false);
  };

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(248,244,236,0.96)" : "rgba(248,244,236,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Primary navigation"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium transition-opacity hover:opacity-55"
                style={{ color: "var(--text)" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-opacity hover:opacity-65"
              aria-label={`Shopping cart, ${count} item${count !== 1 ? "s" : ""}`}
            >
              <ShoppingBag size={20} style={{ color: "var(--text)" }} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white font-semibold"
                    style={{
                      background: "var(--brand)",
                      minWidth: "1.1rem",
                      height: "1.1rem",
                      fontSize: "9px",
                      lineHeight: 1,
                      padding: "0 3px",
                    }}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <span
                className="block h-px w-5 transition-all duration-200 origin-center"
                style={{
                  background: "var(--text)",
                  transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-px w-5 transition-all duration-200"
                style={{ background: "var(--text)", opacity: mobileOpen ? 0 : 1 }}
              />
              <span
                className="block h-px w-5 transition-all duration-200 origin-center"
                style={{
                  background: "var(--text)",
                  transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.18)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              aria-hidden
            />
            <motion.div
              className="fixed top-0 right-0 z-50 h-full w-72 flex flex-col pt-20 pb-10 px-8 overflow-y-auto"
              style={{ background: "var(--bg)", borderLeft: "1px solid var(--border)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 200 }}
              role="navigation"
              aria-label="Mobile navigation"
            >
              {/* Stickers accordion */}
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <button
                  onClick={() => setStickersOpen((v) => !v)}
                  className="flex items-center justify-between w-full py-4 text-sm font-medium text-left"
                  style={{ color: "var(--text)", background: "none", border: "none", cursor: "pointer" }}
                  aria-expanded={stickersOpen}
                >
                  Stickers
                  <span
                    className="transition-transform duration-200"
                    style={{
                      display: "inline-block",
                      transform: stickersOpen ? "rotate(180deg)" : "none",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                    }}
                  >
                    ▾
                  </span>
                </button>
                {stickersOpen && (
                  <div className="pb-3 flex flex-col gap-0.5">
                    <Link
                      href="/shop"
                      onClick={closeMobile}
                      className="py-2 pl-4 text-sm transition-opacity hover:opacity-60"
                      style={{ color: "var(--text-muted)" }}
                    >
                      All designs
                    </Link>
                    {CATEGORY_ORDER.map((key) => (
                      <Link
                        key={key}
                        href={`/shop?category=${key}`}
                        onClick={closeMobile}
                        className="py-2 pl-4 text-sm transition-opacity hover:opacity-60"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {CATEGORY_LABELS[key]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <Link
                  href="/wholesale"
                  onClick={closeMobile}
                  className="flex items-center w-full py-4 text-sm font-medium transition-opacity hover:opacity-60"
                  style={{ color: "var(--text)" }}
                >
                  Sunday Schools
                </Link>
              </div>

              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <Link
                  href="#story"
                  onClick={closeMobile}
                  className="flex items-center w-full py-4 text-sm font-medium transition-opacity hover:opacity-60"
                  style={{ color: "var(--text)" }}
                >
                  About
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
