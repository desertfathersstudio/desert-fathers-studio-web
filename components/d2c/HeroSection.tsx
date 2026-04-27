"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CATALOG, type Sticker } from "@/lib/catalog";

const POSITIONS = [
  { size: 176, style: { top: "8%", right: "6%" },   rotate: 2.5,  floatY: [-8, 4, -8],   duration: 5.2, delay: 0 },
  { size: 136, style: { top: "42%", right: "24%" },  rotate: -3,   floatY: [0, -10, 0],   duration: 6.0, delay: 1.1 },
  { size: 148, style: { bottom: "12%", right: "8%" }, rotate: 1.5, floatY: [-6, 6, -6],   duration: 4.8, delay: 0.6 },
  { size: 116, style: { top: "16%", right: "40%" },  rotate: -2,   floatY: [0, -8, 0],    duration: 5.6, delay: 1.8 },
];

export function HeroSection() {
  const reduced = useReducedMotion();
  const [floaters, setFloaters] = useState<Sticker[]>([]);

  useEffect(() => {
    const singles = CATALOG.filter((s) => !s.isPack);
    const shuffled = [...singles].sort(() => Math.random() - 0.5);
    setFloaters(shuffled.slice(0, 4));
  }, []);

  return (
    <section
      className="relative flex items-center overflow-hidden pt-16"
      style={{ background: "var(--bg)", minHeight: "88vh" }}
    >
      {/* ── Background church photo — desktop only, static ──────────── */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        {/* 1. Photo — desaturated + warm-shifted */}
        <img
          src="/images/hero-church.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.22, filter: "saturate(0.35) sepia(0.15)" }}
        />
        {/* 2. Cream tone overlay — unifies image with parchment bg */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(248,244,236,0.50)" }}
        />
        {/* 3. Vertical gradient — fades image at top (header) and bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #F8F4EC 0%, transparent 22%, transparent 75%, #F8F4EC 100%)",
          }}
        />
      </div>

      {/* Gold hairline top accent */}
      <div
        className="absolute top-16 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold) 70%, transparent)" }}
        aria-hidden
      />

      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-28 relative z-10">
        <div className="max-w-[520px]">
          {/* Eyebrow */}
          <motion.p
            className="text-[11px] uppercase tracking-[0.28em] font-medium mb-7"
            style={{ color: "var(--gold)" }}
            initial={reduced ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            Coptic Orthodox Icon Stickers
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="leading-[1.05] mb-7"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(3rem, 5.5vw, 5rem)",
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
            <em style={{ color: "var(--brand)", fontStyle: "italic" }}>
              for every
            </em>
            <br />
            faithful heart.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-base leading-relaxed mb-10"
            style={{ color: "var(--text-muted)", maxWidth: "38ch" }}
            initial={reduced ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            Hand-designed icon stickers rooted in Coptic tradition — for your
            Bible, planner, water bottle, or anywhere faith travels with you.
          </motion.p>

          {/* CTAs */}
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
              href="/wholesale"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{
                border: "1px solid var(--border-dark)",
                color: "var(--text)",
                borderRadius: "var(--radius-btn)",
              }}
            >
              Wholesale Inquiry
            </Link>
          </motion.div>

          {/* Proof line */}
          <motion.p
            className="mt-10 text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Handmade in Chicago · Trusted by Coptic Sunday schools across the US
          </motion.p>
        </div>
      </div>

      {/* Floating stickers — desktop only, randomized per page load */}
      {!reduced && floaters.length === 4 && (
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          aria-hidden
        >
          {POSITIONS.map((pos, i) => {
            const s = floaters[i];
            return (
              <motion.div
                key={s.id}
                className="absolute overflow-hidden rounded-2xl"
                style={{
                  ...pos.style,
                  width: pos.size,
                  height: pos.size,
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 8px 32px rgba(42,26,14,0.10), 0 2px 8px rgba(42,26,14,0.06)",
                  backdropFilter: "blur(2px)",
                  WebkitBackdropFilter: "blur(2px)",
                  padding: 14,
                  rotate: pos.rotate,
                }}
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{
                  opacity: 0.9,
                  scale: 1,
                  y: [...pos.floatY],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.5 + i * 0.2 },
                  scale: { duration: 0.6, delay: 0.5 + i * 0.2 },
                  y: {
                    duration: pos.duration,
                    delay: pos.delay,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  },
                }}
              >
                <Image
                  src={`/stickers/${s.filename}`}
                  alt={s.name}
                  fill
                  className="object-contain p-3"
                  sizes="200px"
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom divider */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "var(--border)" }}
        aria-hidden
      />
    </section>
  );
}
