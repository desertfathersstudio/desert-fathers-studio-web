import Image from "next/image";
import Link from "next/link";
import { CATALOG, type Sticker } from "@/lib/catalog";
import { HWP_PACK_PRICE, RP_PACK_PRICE } from "@/lib/pricing";

interface PackConfig {
  id: string;
  name: string;
  backCover: string;
  price: number;
  packSize: number;
  category: "holy-week" | "resurrection";
  description: string;
  accent: string;
}

const PACK_CONFIGS: Record<string, PackConfig> = {
  "holy-week-pack": {
    id: "holy-week-pack",
    name: "Holy Week Pack",
    backCover: "Holy Week Pack BACK.png",
    price: HWP_PACK_PRICE,
    packSize: 23,
    category: "holy-week",
    description: "23 scenes from Palm Sunday through the Resurrection — the full arc of Holy Week in Coptic iconographic style.",
    accent: "var(--brand)",
  },
  "resurrection-pack": {
    id: "resurrection-pack",
    name: "Resurrection Pack",
    backCover: "Resurrection Pack BACK.png",
    price: RP_PACK_PRICE,
    packSize: 10,
    category: "resurrection",
    description: "10 scenes from the Resurrection appearances through Pentecost — the fifty days of Eastertide.",
    accent: "var(--gold)",
  },
};

export function PackDetail({ slug }: { slug: string }) {
  const pack = PACK_CONFIGS[slug];
  if (!pack) return null;

  const stickers: Sticker[] = CATALOG.filter((s) => s.category === pack.category);
  const soloCount = stickers.filter((s) => !s.packOnly).length;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-8">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to catalog
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-[1fr_1fr] gap-12 md:gap-20 items-start">

          {/* Back cover image */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "1/1",
              background: "white",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border)",
            }}
          >
            <Image
              src={`/stickers/${pack.backCover}`}
              alt={`${pack.name} — all included designs`}
              fill
              className="object-contain p-6"
              priority
            />
          </div>

          {/* Pack info */}
          <div className="md:sticky md:top-24">
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-4"
              style={{ color: pack.accent }}
            >
              Set of {pack.packSize}
            </p>
            <h1
              className="mb-5 leading-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 300,
                color: "var(--text)",
              }}
            >
              {pack.name}
            </h1>
            <p
              className="mb-8 leading-relaxed"
              style={{ color: "var(--text-muted)", maxWidth: "44ch" }}
            >
              {pack.description}
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="text-2xl font-medium"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--brand)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${pack.price.toFixed(2)}
              </span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                for all {pack.packSize} designs
              </span>
            </div>

            {/* Key callouts */}
            <div
              className="flex flex-col gap-2 mb-8 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <span>✦ {stickers.length} unique designs in this pack</span>
              {soloCount > 0 && (
                <span>✦ {soloCount} of {stickers.length} also available individually</span>
              )}
              <span>✦ 2&quot; die-cut, weather-resistant vinyl</span>
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-medium text-sm transition-opacity hover:opacity-85"
              style={{
                background: "var(--brand)",
                color: "var(--text-inverse)",
                borderRadius: "var(--radius-btn)",
              }}
            >
              Shop all stickers
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="max-w-7xl mx-auto px-6 md:px-10"
        style={{ borderTop: "1px solid var(--border)" }}
      />

      {/* Sticker grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              What&apos;s inside
            </p>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 400, color: "var(--text)" }}>
              {stickers.length} designs
            </p>
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--brand)",
                  opacity: 0.7,
                }}
              />
              Pack only
            </span>
            <span className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--gold)",
                }}
              />
              Also sold individually
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {stickers.map((sticker) => (
            <div key={sticker.id} className="group flex flex-col">
              {/* Image */}
              <div
                className="relative aspect-square overflow-hidden"
                style={{
                  background: "white",
                  borderRadius: "var(--radius-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <Image
                  src={`/stickers/${sticker.filename}`}
                  alt={sticker.name}
                  fill
                  className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {/* Availability dot */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: sticker.packOnly ? "var(--brand)" : "var(--gold)",
                    opacity: sticker.packOnly ? 0.7 : 1,
                  }}
                />
              </div>

              {/* Name + badge */}
              <div className="mt-2 flex flex-col gap-0.5">
                <p
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "0.9rem",
                    color: "var(--text)",
                    lineHeight: 1.3,
                  }}
                >
                  {sticker.name}
                </p>
                <p
                  style={{
                    fontSize: "0.68rem",
                    color: sticker.packOnly ? "var(--text-muted)" : "var(--gold)",
                    fontWeight: sticker.packOnly ? 400 : 500,
                  }}
                >
                  {sticker.packOnly ? "Pack only" : "Also sold individually"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        {soloCount > 0 && (
          <div
            className="mt-14 mx-auto max-w-xl text-center"
            style={{
              padding: "1.25rem 1.5rem",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--text)", marginBottom: "0.4rem" }}>
              Want just a few?
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {soloCount} sticker{soloCount !== 1 ? "s" : ""} from this pack can be purchased individually for $2.00 each. Browse them in the main catalog.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--brand)" }}
            >
              Browse individual stickers →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
