"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATALOG, stickerImageUrl } from "@/lib/catalog";

const ITEM_W = 108;
const ITEM_GAP = 16;
const ITEM_STRIDE = ITEM_W + ITEM_GAP;

type StripItem = { id: string; name: string; imageUrl: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function catalogFallback(): StripItem[] {
  return CATALOG.map((s) => ({ id: s.id, name: s.name, imageUrl: stickerImageUrl(s.filename) }));
}

export function HeroStickerStrip({
  imageMap = {},
  stripItems = [],
}: {
  imageMap?: Record<string, string>;
  stripItems?: StripItem[];
}) {
  const source: StripItem[] = stripItems.length > 0 ? stripItems : catalogFallback();

  // Override imageUrls with versioned URLs from imageMap where available
  const resolved: StripItem[] = source.map((s) => ({
    ...s,
    imageUrl: imageMap[s.name] ?? s.imageUrl,
  }));

  const CYCLE_PX = resolved.length * ITEM_STRIDE;
  const DURATION_S = Math.round(CYCLE_PX / 80);

  const [copy, setCopy] = useState<StripItem[]>(resolved);

  useEffect(() => {
    setCopy(shuffle(resolved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = [...copy, ...copy];

  return (
    <div className="relative overflow-hidden" aria-hidden>
      <style>{`
        @keyframes hero-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-${CYCLE_PX}px); }
        }
        .hero-strip-track {
          animation: hero-marquee ${DURATION_S}s linear infinite;
        }
        .hero-strip-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-strip-track { animation: none; }
        }
      `}</style>

      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{ width: 80, background: "linear-gradient(to right, var(--bg), transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{ width: 80, background: "linear-gradient(to left, var(--bg), transparent)" }}
      />

      <div className="hero-strip-track flex">
        {items.map((sticker, i) => (
          <Link
            key={`${sticker.id}-${i}`}
            href="/shop"
            tabIndex={-1}
            className="flex-shrink-0 block"
            style={{ marginRight: ITEM_GAP }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: ITEM_W,
                height: ITEM_W,
                borderRadius: 14,
                background: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              <Image
                src={sticker.imageUrl}
                alt={sticker.name}
                fill
                className="object-contain p-2"
                sizes="108px"
                draggable={false}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
