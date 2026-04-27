"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative flex items-center overflow-hidden pt-16"
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
            background: "linear-gradient(to bottom, #F8F4EC 0%, transparent 22%, transparent 75%, #F8F4EC 100%)",
          }}
        />
      </div>

      {/* Gold hairline top accent */}
      <div
        className="absolute top-16 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold) 70%, transparent)" }}
        aria-hidden
      />

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
            Sacred art
            <br />
            <em style={{ color: "var(--brand)", fontStyle: "italic" }}>for every</em>
            <br />
            faithful heart.
          </motion.h1>

          <motion.p
            className="text-base leading-relaxed mb-8"
            style={{ color: "var(--text-muted)", maxWidth: "38ch" }}
            initial={reduced ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            Hand-designed icon stickers rooted in Coptic tradition — for your
            Bible, planner, water bottle, or anywhere faith travels with you.
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

          <motion.p
            className="mt-8 text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Handmade in Chicago · Trusted by Coptic Sunday schools across the US
          </motion.p>
        </div>
      </div>

      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "var(--border)" }}
        aria-hidden
      />
    </section>
  );
}
