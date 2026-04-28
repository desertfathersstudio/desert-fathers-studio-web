"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StickerProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  isNew?: boolean;
  isPack?: boolean;
  packSize?: number;
  packOnly?: boolean;
}

interface StickerCardProps {
  product: StickerProduct;
  className?: string;
  skeleton?: boolean;
  onAddToCart?: () => void;
  onOpen?: () => void;
}

export function StickerCard({
  product,
  className,
  skeleton,
  onAddToCart,
  onOpen,
}: StickerCardProps) {
  const reduced = useReducedMotion();

  if (skeleton) {
    return (
      <article className={cn("flex flex-col", className)}>
        <div
          className="aspect-square rounded-xl animate-pulse"
          style={{ background: "var(--border)" }}
        />
        <div className="pt-3 space-y-2 px-1">
          <div
            className="h-3 rounded animate-pulse"
            style={{ background: "var(--border)", width: "60%" }}
          />
          <div
            className="h-4 rounded animate-pulse"
            style={{ background: "var(--border)", width: "80%" }}
          />
          <div
            className="h-3 rounded animate-pulse"
            style={{ background: "var(--border)", width: "30%" }}
          />
        </div>
      </article>
    );
  }

  return (
    <motion.article
      className={cn("group relative flex flex-col cursor-pointer", className)}
      whileHover={reduced ? {} : { y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onOpen}
    >
      {/* White card frame */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-card)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {/* Image area */}
        <div
          className="relative aspect-square overflow-hidden"
          style={{ background: "#ffffff" }}
        >
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {product.isNew && (
            <span
              className="absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5"
              style={{
                background: "var(--gold)",
                color: "#fff",
                borderRadius: 3,
              }}
            >
              New
            </span>
          )}

          {product.isPack && product.packSize && (
            <span
              className="absolute top-2 right-2 text-[9px] font-medium uppercase tracking-wide px-2 py-0.5"
              style={{
                background: "var(--navy)",
                color: "#fff",
                borderRadius: 3,
                opacity: 0.85,
              }}
            >
              {product.packSize} stickers
            </span>
          )}

          {product.packOnly && (
            <span
              className="absolute top-2 right-2 text-[9px] font-medium uppercase tracking-wide px-2 py-0.5"
              style={{
                background: "var(--text-muted)",
                color: "#fff",
                borderRadius: 3,
                opacity: 0.75,
              }}
            >
              Pack only
            </span>
          )}
        </div>

        {/* Add to cart — slides up from below the image, never covers it */}
        {onAddToCart && (
          <div
            className="translate-y-full group-hover:translate-y-0 transition-transform duration-200"
          >
            <button
              className="w-full py-2 text-xs font-medium text-center"
              style={{
                background: "var(--brand)",
                color: "#fff",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              aria-label={`Add ${product.name} to cart`}
            >
              Add to cart
            </button>
          </div>
        )}
      </div>

      {/* Text below */}
      <div className="pt-3 pb-1">
        <h3
          className="leading-snug"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "0.95rem",
            color: "var(--text)",
          }}
        >
          {product.name}
        </h3>
        {product.packOnly ? (
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
          >
            Part of pack
          </p>
        ) : (
          <p
            className="mt-0.5 text-sm font-medium"
            style={{
              color: "var(--brand)",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-sans)",
              fontSize: "0.85rem",
            }}
          >
            ${product.price.toFixed(2)}
          </p>
        )}
      </div>
    </motion.article>
  );
}
