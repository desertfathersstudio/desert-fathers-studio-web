"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { useCart } from "@/lib/cart";

const SHOP_LINKS = [
  { href: "/shop",                      label: "All Designs"  },
  { href: "/shop?category=packs",       label: "Packs"        },
  { href: "/shop?category=individuals", label: "Individuals"  },
];

export function Nav() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [shopDropdown, setShopDropdown] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
            {/* Shop dropdown */}
            <div
              ref={shopRef}
              className="relative"
              onMouseEnter={() => setShopDropdown(true)}
              onMouseLeave={() => setShopDropdown(false)}
            >
              <button
                onClick={() => setShopDropdown((v) => !v)}
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-55"
                style={{ color: "var(--text)", background: "none", border: "none", cursor: "pointer" }}
                aria-haspopup="true"
                aria-expanded={shopDropdown}
              >
                Shop
                <ChevronDown
                  size={13}
                  className="transition-transform duration-200"
                  style={{ transform: shopDropdown ? "rotate(180deg)" : "none", opacity: 0.6 }}
                />
              </button>

              <AnimatePresence>
                {shopDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 pt-2 z-50"
                    style={{ minWidth: 148 }}
                  >
                    <div
                      className="flex flex-col py-1.5"
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-card)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      }}
                    >
                      {SHOP_LINKS.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setShopDropdown(false)}
                          className="px-4 py-2 text-sm transition-opacity hover:opacity-60"
                          style={{ color: "var(--text)" }}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/suggestions"
              className="text-sm font-medium transition-opacity hover:opacity-55"
              style={{ color: "var(--text)" }}
            >
              Suggestions
            </Link>
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
              {/* Shop accordion — 3 clean options */}
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <button
                  onClick={() => setStickersOpen((v) => !v)}
                  className="flex items-center justify-between w-full py-4 text-sm font-medium text-left"
                  style={{ color: "var(--text)", background: "none", border: "none", cursor: "pointer" }}
                  aria-expanded={stickersOpen}
                >
                  Shop
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
                      All Stickers
                    </Link>
                    <Link
                      href="/shop?category=packs"
                      onClick={closeMobile}
                      className="py-2 pl-4 text-sm transition-opacity hover:opacity-60"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Packs
                    </Link>
                    <Link
                      href="/shop?category=individuals"
                      onClick={closeMobile}
                      className="py-2 pl-4 text-sm transition-opacity hover:opacity-60"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Individuals
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <Link
                  href="/suggestions"
                  onClick={closeMobile}
                  className="flex items-center w-full py-4 text-sm font-medium transition-opacity hover:opacity-60"
                  style={{ color: "var(--text)" }}
                >
                  Suggestions
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
