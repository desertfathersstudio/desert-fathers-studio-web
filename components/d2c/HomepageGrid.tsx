"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CATALOG } from "@/lib/catalog";
import { StickerCard } from "@/components/shared/StickerCard";
import { useCart } from "@/lib/cart";
import { useLightbox } from "@/lib/lightbox";

const FEATURED_IDS = [
  "pantokrator",
  "archangel-michael",
  "pope-shenouda-joy",
  "st-george",
  "holy-family",
  "martyrs-of-libya",
  "ti-theotokos",
  "transfiguration",
];

const FEATURED = FEATURED_IDS
  .map((id) => CATALOG.find((s) => s.id === id))
  .filter((s): s is NonNullable<typeof s> => s != null);

export function HomepageGrid() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const reduced = useReducedMotion();
  const { add } = useCart();
  const { open: openLightbox } = useLightbox();

  return (
    <section
      ref={ref}
      className="py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Heading */}
        <motion.div
          className="flex items-end justify-between mb-12"
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55 }}
        >
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
              style={{ color: "var(--gold)" }}
            >
              Bestsellers
            </p>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
                fontWeight: 400,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              Beloved by the faithful.
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60 shrink-0 mb-1"
            style={{ color: "var(--brand)" }}
          >
            View all →
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {FEATURED.map((sticker, i) => (
            <motion.div
              key={sticker.id}
              initial={reduced ? {} : { opacity: 0, y: 28 }}
              animate={
                inView
                  ? { opacity: 1, y: 0 }
                  : reduced
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 28 }
              }
              transition={{
                duration: 0.5,
                delay: reduced ? 0 : i * 0.06,
                ease: "easeOut",
              }}
            >
              <StickerCard
                product={{
                  id: sticker.id,
                  name: sticker.name,
                  price: sticker.price,
                  imageUrl: `/stickers/${sticker.filename}`,
                  category: sticker.category,
                  isNew: sticker.isNew,
                }}
                onAddToCart={() => add(sticker)}
                onOpen={() => openLightbox(FEATURED, i)}
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile "view all" */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              border: "1px solid var(--border-dark)",
              color: "var(--text)",
              borderRadius: "var(--radius-btn)",
            }}
          >
            View all stickers →
          </Link>
        </div>
      </div>
    </section>
  );
}
