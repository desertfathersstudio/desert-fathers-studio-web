import Image from "next/image";
import Link from "next/link";
import { CATALOG, type Sticker } from "@/lib/catalog";

interface PackConfig {
  id: string;
  name: string;
  backCover: string;
  price: number;
  packSize: number;
  category: "holy-week" | "resurrection";
  description: string;
}

const PACK_CONFIGS: Record<string, PackConfig> = {
  "holy-week-pack": {
    id: "holy-week-pack",
    name: "Holy Week Pack",
    backCover: "Holy Week Pack BACK.png",
    price: 10.00,
    packSize: 23,
    category: "holy-week",
    description: "23 scenes from Palm Sunday through the Resurrection — the full arc of Holy Week in Coptic iconographic style.",
  },
  "resurrection-pack": {
    id: "resurrection-pack",
    name: "Resurrection Pack",
    backCover: "Resurrection Pack BACK.png",
    price: 5.00,
    packSize: 10,
    category: "resurrection",
    description: "10 scenes from the Resurrection appearances through Pentecost — the fifty days of Eastertide.",
  },
};

export function PackDetail({ slug }: { slug: string }) {
  const pack = PACK_CONFIGS[slug];
  if (!pack) return null;

  const stickers: Sticker[] = CATALOG.filter((s) => s.category === pack.category);

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

      {/* Hero: back cover + pack info */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-[1fr_1fr] gap-12 md:gap-20 items-start">

          {/* Back cover image */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "1/1",
              background: "var(--bg-card)",
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
              style={{ color: "var(--gold)" }}
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

            <div className="flex items-baseline gap-3 mb-8">
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

            <button
              className="inline-flex items-center gap-2 px-7 py-3.5 font-medium text-sm transition-opacity hover:opacity-85"
              style={{
                background: "var(--brand)",
                color: "var(--text-inverse)",
                borderRadius: "var(--radius-btn)",
                cursor: "pointer",
              }}
            >
              Add pack to cart
            </button>
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
        <p
          className="text-[11px] uppercase tracking-[0.2em] font-medium mb-10"
          style={{ color: "var(--text-muted)" }}
        >
          What&apos;s inside — {stickers.length} designs
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {stickers.map((sticker) => (
            <div key={sticker.id} className="group">
              <div
                className="relative aspect-square overflow-hidden"
                style={{
                  background: "var(--bg-card)",
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
              </div>
              <p
                className="mt-2 leading-snug"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "0.9rem",
                  color: "var(--text)",
                }}
              >
                {sticker.name}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
