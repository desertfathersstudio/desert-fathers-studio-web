"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATALOG, type Sticker } from "@/lib/catalog";

const ITEM_W = 108;  // px
const ITEM_GAP = 16; // px — right margin on every item (no flex gap, so math is exact)
const ITEM_STRIDE = ITEM_W + ITEM_GAP; // 124px per slot
const CYCLE_PX = CATALOG.length * ITEM_STRIDE; // exact pixel width of one copy
const DURATION_S = Math.round(CYCLE_PX / 80); // ~80 px/s scroll speed

function shuffle(arr: Sticker[]): Sticker[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HeroStickerStrip() {
  // Start with catalog order (server + hydration safe), shuffle after mount
  const [copy, setCopy] = useState<Sticker[]>(CATALOG);

  useEffect(() => {
    setCopy(shuffle(CATALOG));
  }, []);

  // Two identical copies — when we slide exactly -CYCLE_PX, copy 2 is in the same
  // position copy 1 started, so the loop is pixel-perfect seamless.
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

      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{ width: 80, background: "linear-gradient(to right, var(--bg), transparent)" }}
      />
      {/* Right fade */}
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
                src={`/stickers/${sticker.filename}`}
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
