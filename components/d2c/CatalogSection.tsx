"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CATALOG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CategoryKey,
  type Sticker,
} from "@/lib/catalog";
import { stickerImageUrl } from "@/lib/catalog";
import { StickerCard, type StickerProduct } from "@/components/shared/StickerCard";
import { useCart } from "@/lib/cart";
import { useLightbox } from "@/lib/lightbox";

function resolveImageUrl(s: Sticker, imageOverrides?: Record<string, string>): string {
  return s.imageUrl ?? imageOverrides?.[s.name] ?? stickerImageUrl(s.filename);
}

function toCardProduct(s: Sticker, soldOut: boolean, imageOverrides?: Record<string, string>): StickerProduct {
  return {
    id: s.id,
    name: s.name,
    price: s.price,
    imageUrl: resolveImageUrl(s, imageOverrides),
    category: s.category,
    isNew: s.isNew,
    isPack: s.isPack,
    packSize: s.packSize,
    packOnly: s.packOnly,
    soldOut,
  };
}

export function CatalogSection({
  initialCategory,
  soldOutNames = [],
  activeNames = [],
  imageOverrides = {},
}: {
  initialCategory?: CategoryKey;
  soldOutNames?: string[];
  activeNames?: string[];
  imageOverrides?: Record<string, string>;
}) {
  const [active, setActive] = useState<CategoryKey>(initialCategory ?? "all");
  const { add, openCart } = useCart();
  const { open: openLightbox } = useLightbox();
  const soldOutSet  = useMemo(() => new Set(soldOutNames),  [soldOutNames]);
  const activeSet   = useMemo(() => new Set(activeNames),   [activeNames]);

  // Sync active filter when initialCategory changes via URL navigation
  useEffect(() => {
    setActive(initialCategory ?? "all");
  }, [initialCategory]);

  const visibleCatalog = useMemo(
    () => CATALOG.filter((s) => s.isPack || (activeSet.size > 0 ? activeSet.has(s.name) : true)),
    [activeSet]
  );

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      items: visibleCatalog.filter((s) => s.category === key),
    })).filter((g) => g.items.length > 0);
  }, [visibleCatalog]);

  const packGroup = useMemo(
    () => grouped.find((g) => g.key === "packs"),
    [grouped]
  );

  const flatStickers = useMemo(
    () =>
      CATEGORY_ORDER.filter((k) => k !== "packs").flatMap((key) =>
        visibleCatalog.filter((s) => s.category === key && !s.isPack)
      ),
    [visibleCatalog]
  );

  const totalDesigns = visibleCatalog.length;

  return (
    <section id="catalog" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-28 md:pb-40">
        {/* Header */}
        <div className="mb-10">
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-medium mb-3"
            style={{ color: "var(--gold)" }}
          >
            The Catalog
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              color: "var(--text)",
            }}
          >
            {totalDesigns} designs, rooted in tradition.
          </h2>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            All stickers are 3 inches. For custom sizes,{" "}
            <a
              href="mailto:desertfathersstudio@gmail.com"
              className="underline underline-offset-2 transition-opacity hover:opacity-70"
            >
              contact us
            </a>
            .
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-14">
          <Pill label="All" active={active === "all"} onClick={() => setActive("all")} />
          {CATEGORY_ORDER.map((key) => (
            <Pill
              key={key}
              label={CATEGORY_LABELS[key]}
              active={active === key}
              onClick={() => setActive(key)}
            />
          ))}
        </div>

        {/* Content */}
        {active === "all" ? (
          <div className="space-y-12">
            {packGroup && <PackRow items={packGroup.items} activeSet={activeSet} imageOverrides={imageOverrides} onAdd={(s) => { add(s); openCart(); }} />}
            <StickerGrid items={flatStickers} onAdd={add} onOpenLightbox={openLightbox} soldOutSet={soldOutSet} imageOverrides={imageOverrides} />
          </div>
        ) : active === "individuals" ? (
          <StickerGrid items={flatStickers} onAdd={add} onOpenLightbox={openLightbox} soldOutSet={soldOutSet} imageOverrides={imageOverrides} />
        ) : (
          <div>
            {active === "packs" && packGroup ? (
              <PackRow items={packGroup.items} activeSet={activeSet} imageOverrides={imageOverrides} onAdd={(s) => { add(s); openCart(); }} />
            ) : (
              <StickerGrid
                items={grouped.find((g) => g.key === active)?.items ?? []}
                onAdd={add}
                onOpenLightbox={openLightbox}
                soldOutSet={soldOutSet}
                imageOverrides={imageOverrides}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium px-4 py-1.5 transition-all duration-200"
      style={{
        borderRadius: "999px",
        border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
        background: active ? "var(--brand)" : "transparent",
        color: active ? "var(--text-inverse)" : "var(--text-muted)",
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function PackRow({
  items,
  activeSet,
  imageOverrides,
  onAdd,
}: {
  items: Sticker[];
  activeSet: Set<string>;
  imageOverrides?: Record<string, string>;
  onAdd: (s: Sticker) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
      {items.map((pack) => {
        const isComingSoon = activeSet.size > 0 && !activeSet.has(pack.name);
        return (
          <article
            key={pack.id}
            style={{
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            {/* Image — click navigates to pack detail */}
            <Link href={`/shop/${pack.id}`} className="group block">
              <div
                className="relative aspect-square overflow-hidden"
                style={{ background: "#fff" }}
              >
                <Image
                  src={resolveImageUrl(pack, imageOverrides)}
                  alt={pack.name}
                  fill
                  className="object-contain p-12 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                {isComingSoon && (
                  <span
                    className="absolute top-3 left-3 text-[9px] font-semibold uppercase tracking-wide px-2 py-1"
                    style={{
                      background: "var(--brand)",
                      color: "#efe7d6",
                      borderRadius: 4,
                    }}
                  >
                    Coming Soon
                  </span>
                )}
              </div>
            </Link>

            {/* Info + action */}
            <div
              className="px-6 py-5"
              style={{
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.2rem",
                  color: "var(--text)",
                }}
              >
                {pack.name} — Set of {pack.packSize}
              </h3>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: "var(--brand)",
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  ${pack.price.toFixed(2)}
                </p>
                {isComingSoon ? (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
                  >
                    Available soon
                  </span>
                ) : (
                  <button
                    onClick={() => onAdd(pack)}
                    className="text-xs font-semibold px-4 py-2 transition-opacity hover:opacity-80"
                    style={{
                      background: "var(--brand)",
                      color: "#efe7d6",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StickerGrid({
  items,
  onAdd,
  onOpenLightbox,
  soldOutSet,
  imageOverrides,
}: {
  items: Sticker[];
  onAdd: (s: Sticker) => void;
  onOpenLightbox: (items: Sticker[], index: number) => void;
  soldOutSet: Set<string>;
  imageOverrides?: Record<string, string>;
}) {
  // Build items with imageUrl pre-resolved so lightbox also uses the correct URL
  const resolvedItems = useMemo(
    () => items.map((s) => ({ ...s, imageUrl: resolveImageUrl(s, imageOverrides) })),
    [items, imageOverrides]
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
      {resolvedItems.map((sticker, i) => {
        const soldOut = soldOutSet.has(sticker.name);
        return (
          <StickerCard
            key={sticker.id}
            product={toCardProduct(sticker, soldOut)}
            onAddToCart={sticker.packOnly || soldOut ? undefined : () => onAdd(sticker)}
            onOpen={() => onOpenLightbox(resolvedItems, i)}
          />
        );
      })}
    </div>
  );
}
