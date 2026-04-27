"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CATALOG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CategoryKey,
  type Sticker,
} from "@/lib/catalog";
import { StickerCard, type StickerProduct } from "@/components/shared/StickerCard";
import { useCart } from "@/lib/cart";
import { useLightbox } from "@/lib/lightbox";

function toCardProduct(s: Sticker): StickerProduct {
  return {
    id: s.id,
    name: s.name,
    price: s.price,
    imageUrl: `/stickers/${s.filename}`,
    category: s.category,
    isNew: s.isNew,
    isPack: s.isPack,
    packSize: s.packSize,
  };
}

export function CatalogSection({
  initialCategory,
}: {
  initialCategory?: CategoryKey;
}) {
  const [active, setActive] = useState<CategoryKey>(initialCategory ?? "all");
  const { add } = useCart();
  const { open: openLightbox } = useLightbox();

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      items: CATALOG.filter((s) => s.category === key),
    })).filter((g) => g.items.length > 0);
  }, []);

  const packGroup = useMemo(
    () => grouped.find((g) => g.key === "packs"),
    [grouped]
  );

  const flatStickers = useMemo(
    () =>
      CATEGORY_ORDER.filter((k) => k !== "packs").flatMap((key) =>
        CATALOG.filter((s) => s.category === key)
      ),
    []
  );

  const totalDesigns = CATALOG.length;

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
            {totalDesigns} designs, all sacred.
          </h2>
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
            {packGroup && <PackRow items={packGroup.items} />}
            <StickerGrid items={flatStickers} onAdd={add} onOpenLightbox={openLightbox} />
          </div>
        ) : (
          <div>
            {active === "packs" && packGroup ? (
              <PackRow items={packGroup.items} />
            ) : (
              <StickerGrid
                items={grouped.find((g) => g.key === active)?.items ?? []}
                onAdd={add}
                onOpenLightbox={openLightbox}
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

function PackRow({ items }: { items: Sticker[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
      {items.map((pack) => (
        <Link key={pack.id} href={`/shop/${pack.id}`} className="group block">
          <article
            style={{
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            {/* White image frame */}
            <div
              className="relative aspect-square overflow-hidden"
              style={{ background: "#fff" }}
            >
              <Image
                src={`/stickers/${pack.filename}`}
                alt={pack.name}
                fill
                className="object-contain p-12 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
            <div
              className="px-6 py-5"
              style={{
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-1"
                style={{ color: "var(--gold)", fontFamily: "var(--font-sans)" }}
              >
                Set of {pack.packSize}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.2rem",
                  color: "var(--text)",
                }}
              >
                {pack.name}
              </h3>
              <p
                className="mt-1.5 text-sm font-medium"
                style={{
                  color: "var(--brand)",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "var(--font-sans)",
                }}
              >
                ${pack.price.toFixed(2)}
              </p>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function StickerGrid({
  items,
  onAdd,
  onOpenLightbox,
}: {
  items: Sticker[];
  onAdd: (s: Sticker) => void;
  onOpenLightbox: (items: Sticker[], index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
      {items.map((sticker, i) => (
        <StickerCard
          key={sticker.id}
          product={toCardProduct(sticker)}
          onAddToCart={() => onAdd(sticker)}
          onOpen={() => onOpenLightbox(items, i)}
        />
      ))}
    </div>
  );
}
