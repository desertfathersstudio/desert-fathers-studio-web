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

export function CatalogSection({ initialCategory }: { initialCategory?: CategoryKey }) {
  const [active, setActive] = useState<CategoryKey>(initialCategory ?? "all");

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      items: CATALOG.filter((s) => s.category === key),
    })).filter((g) => g.items.length > 0);
  }, []);

  const packGroup = useMemo(() => grouped.find((g) => g.key === "packs"), [grouped]);

  const flatStickers = useMemo(() => {
    return CATEGORY_ORDER.filter((k) => k !== "packs").flatMap((key) =>
      CATALOG.filter((s) => s.category === key)
    );
  }, []);

  const totalDesigns = CATALOG.filter((s) => !s.isPack).length;

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
        <div className="flex flex-wrap gap-2 mb-16">
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
          <div className="space-y-10">
            {packGroup && <PackRow items={packGroup.items} />}
            <StickerGrid items={flatStickers} />
          </div>
        ) : (
          <div>
            {active === "packs" && packGroup ? (
              <PackRow items={packGroup.items} />
            ) : (
              <StickerGrid items={grouped.find((g) => g.key === active)?.items ?? []} />
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
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={`/stickers/${pack.filename}`}
                alt={pack.name}
                fill
                className="object-contain p-10 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
            <div
              className="px-6 py-5"
              style={{ borderTop: "1px solid var(--border)" }}
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

function StickerGrid({ items }: { items: Sticker[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {items.map((sticker) => (
        <StickerItem key={sticker.id} sticker={sticker} />
      ))}
    </div>
  );
}

function StickerItem({ sticker }: { sticker: Sticker }) {
  return (
    <article className="group cursor-pointer">
      <div
        className="relative aspect-square overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-card)",
        }}
      >
        <Image
          src={`/stickers/${sticker.filename}`}
          alt={sticker.name}
          fill
          className="object-contain p-5 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {sticker.isNew && (
          <span
            className="absolute top-2.5 left-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] px-2 py-1"
            style={{
              background: "var(--gold)",
              color: "var(--text-inverse)",
              borderRadius: "3px",
            }}
          >
            New
          </span>
        )}
      </div>
      <div className="pt-2.5 pb-1">
        <h3
          className="leading-snug"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "0.95rem",
            color: "var(--text)",
          }}
        >
          {sticker.name}
        </h3>
        <p
          className="mt-0.5 text-sm font-medium"
          style={{
            color: "var(--brand)",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--font-sans)",
          }}
        >
          ${sticker.price.toFixed(2)}
        </p>
      </div>
    </article>
  );
}
