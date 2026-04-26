import Image from "next/image";
import { cn } from "@/lib/utils";

export interface StickerProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  isNew?: boolean;
}

interface StickerCardProps {
  product: StickerProduct;
  className?: string;
}

export function StickerCard({ product, className }: StickerCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden cursor-pointer",
        className
      )}
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {/* Image container */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ background: "var(--bg-card)" }}
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.isNew && (
          <span
            className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-widest px-2 py-1"
            style={{
              background: "var(--gold)",
              color: "#fff",
              borderRadius: "3px",
              letterSpacing: "0.1em",
            }}
          >
            New
          </span>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 pb-1">
        <p className="text-[11px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {product.category}
        </p>
        <h3
          className="mt-1 leading-snug"
          style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", color: "var(--text)" }}
        >
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--brand)" }}>
          ${product.price.toFixed(2)}
        </p>
      </div>
    </article>
  );
}
