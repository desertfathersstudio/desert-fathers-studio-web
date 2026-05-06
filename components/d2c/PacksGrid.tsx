"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { PACK_CONFIGS } from "@/lib/pack-configs";
import { stickerImageUrl, type Sticker } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export function PacksGrid({ packs }: { packs: Sticker[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const reduced = useReducedMotion();
  const { add, openCart } = useCart();

  if (packs.length === 0) {
    return (
      <div className="text-center py-20">
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.2rem",
            color: "var(--text-muted)",
          }}
        >
          No packs available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10"
    >
      {packs.map((pack, i) => {
        const config = PACK_CONFIGS[pack.id];
        const imageUrl =
          pack.imageUrl ?? (pack.filename ? stickerImageUrl(pack.filename) : null);

        return (
          <motion.article
            key={pack.id}
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={
              inView
                ? { opacity: 1, y: 0 }
                : reduced
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={{
              duration: 0.4,
              delay: reduced ? 0 : i * 0.09,
              ease: "easeOut",
            }}
            style={{
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            <Link href={`/shop/${pack.id}`} className="group block">
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: "1/1", background: "#ffffff" }}
              >
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={pack.name}
                    fill
                    className="object-contain p-10 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    priority={i === 0}
                  />
                )}
              </div>
            </Link>

            <div
              className="px-6 py-6"
              style={{
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.22em] font-medium mb-2"
                style={{ color: config?.accent ?? "var(--gold)" }}
              >
                Set of {pack.packSize}
              </p>
              <h2
                className="mb-3"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  fontWeight: 400,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                }}
              >
                {pack.name}
              </h2>

              {config?.description && (
                <p
                  className="mb-5 text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)", maxWidth: "46ch" }}
                >
                  {config.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span
                  className="text-xl font-medium"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--brand)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${pack.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/shop/${pack.id}`}
                    className="text-xs font-medium px-4 py-2 transition-opacity hover:opacity-70"
                    style={{
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-btn)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    See what&apos;s inside →
                  </Link>
                  <button
                    onClick={() => { add(pack); openCart(); }}
                    className="text-xs font-semibold px-5 py-2 transition-opacity hover:opacity-85"
                    style={{
                      background: "var(--brand)",
                      color: "#efe7d6",
                      borderRadius: "var(--radius-btn)",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
