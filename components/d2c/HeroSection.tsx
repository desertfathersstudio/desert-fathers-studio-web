"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HeroStickerStrip } from "@/components/d2c/HeroStickerStrip";

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden pt-16 flex flex-col"
      style={{ background: "var(--bg)", minHeight: "68vh" }}
    >
      {/* Background church photo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <img
          src="/images/hero-church.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.22, filter: "saturate(0.35) sepia(0.15)" }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(248,244,236,0.50)" }} />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, #F8F4EC 0%, #F8F4EC 12%, transparent 38%, transparent 72%, #F8F4EC 100%)",
          }}
        />
      </div>

      {/* Gold hairline top accent */}
      <div
        className="absolute top-16 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold) 70%, transparent)" }}
        aria-hidden
      />

      {/* Main content */}
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-16 relative z-10">
          <div className="max-w-[520px]">
            <motion.p
              className="text-[11px] uppercase tracking-[0.28em] font-medium mb-6"
              style={{ color: "var(--gold)" }}
              initial={reduced ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              Coptic Orthodox Icon Stickers
            </motion.p>

            <motion.h1
              className="leading-[1.05] mb-6"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                fontWeight: 300,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
              initial={reduced ? {} : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
            >
              Rooted in the{" "}
              <span style={{ fontStyle: "italic", color: "var(--gold)" }}>Coptic</span>{" "}
              tradition.
            </motion.h1>

            <motion.p
              className="text-base leading-relaxed mb-8"
              style={{ color: "var(--text-muted)", maxWidth: "38ch" }}
              initial={reduced ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              Timeless iconography, reimagined for daily life — without losing its meaning.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={reduced ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.5 }}
            >
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium transition-opacity hover:opacity-85"
                style={{
                  background: "var(--brand)",
                  color: "#fff",
                  borderRadius: "var(--radius-btn)",
                }}
              >
                Shop Stickers
              </Link>
              <Link
                href="#what-you-get"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{
                  border: "1px solid var(--border-dark)",
                  color: "var(--text)",
                  borderRadius: "var(--radius-btn)",
                }}
              >
                What you get
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticker strip */}
      <motion.div
        className="relative z-10 pt-16 pb-12"
        initial={reduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.75 }}
      >
        <HeroStickerStrip />
      </motion.div>

      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "var(--border)" }}
        aria-hidden
      />
    </section>
  );
}
