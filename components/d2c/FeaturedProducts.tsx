import { StickerCard, type StickerProduct } from "@/components/shared/StickerCard";

const FEATURED: StickerProduct[] = [
  {
    id: "pope-shenouda",
    name: "Pope Shenouda III",
    price: 0.70,
    imageUrl: "/stickers/Pope Shenouda - Liturgy.png",
    category: "Saints",
    isNew: false,
  },
  {
    id: "archangel-michael",
    name: "Archangel Michael",
    price: 0.70,
    imageUrl: "/stickers/Archangel Michael.png",
    category: "Angels",
    isNew: true,
  },
  {
    id: "resurrection",
    name: "The Resurrection",
    price: 0.70,
    imageUrl: "/stickers/Resurrection.png",
    category: "Feasts",
    isNew: false,
  },
  {
    id: "holy-week-pack",
    name: "Holy Week Pack",
    price: 10.00,
    imageUrl: "/stickers/Christ Passion Week.png",
    category: "Pack · Set of 23",
    isNew: false,
  },
];

export function FeaturedProducts() {
  return (
    <section
      id="catalog"
      className="py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-3"
              style={{ color: "var(--gold)" }}
            >
              Featured Designs
            </p>
            <h2
              className="leading-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 400,
                color: "var(--text)",
              }}
            >
              Carry the faith
              <br />
              <em style={{ color: "var(--brand)" }}>wherever you go.</em>
            </h2>
          </div>
          <a
            href="#"
            className="hidden md:inline-flex text-sm font-medium pb-0.5 transition-opacity hover:opacity-60"
            style={{
              color: "var(--text-muted)",
              borderBottom: "1px solid var(--border-dark)",
            }}
          >
            View all designs →
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {FEATURED.map((product, i) => (
            <StickerCard
              key={product.id}
              product={product}
              className={`reveal reveal-${Math.min(i + 1, 4)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
