"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";

const COLLECTIONS = [
  {
    id: "holy-week",
    title: "Holy Week Pack",
    badge: "Set of 23 · $18.00",
    description:
      "The complete story of Holy Week, from the Raising of Lazarus to the Resurrection.",
    href: "/shop/holy-week-pack",
    image: "/stickers/Holy Week Pack BACK.png",
    accentColor: "var(--brand)",
  },
  {
    id: "resurrection",
    title: "Resurrection Pack",
    badge: "Set of 10 · $10.00",
    description:
      "Ten Resurrection appearances — from the Empty Tomb to Pentecost.",
    href: "/shop/resurrection-pack",
    image: "/stickers/Resurrection Pack BACK.png",
    accentColor: "var(--gold)",
  },
  {
    id: "individual",
    title: "Individual Stickers",
    badge: "$2.00 each",
    description:
      "Saints, angels, prophets, Christ, Our Lady, and more — browse 80+ designs.",
    href: "/shop",
    image: "/stickers/Pantokrator.png",
    accentColor: "var(--navy)",
  },
] as const;

export function FeaturedCollections() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const reduced = useReducedMotion();

  const fadeProps = (delay = 0) => ({
    initial: reduced ? undefined : { opacity: 0, y: 26 },
    animate: reduced
      ? undefined
      : inView
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 26 },
    transition: { duration: 0.55, delay, ease: "easeOut" as const },
  });

  return (
    <section
      ref={ref}
      className="py-24 md:py-32"
      style={{ background: "var(--cream)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Heading */}
        <motion.div className="mb-14" {...fadeProps(0)}>
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
            style={{ color: "var(--gold)" }}
          >
            Collections
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
              fontWeight: 400,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Find your sticker.
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {COLLECTIONS.map((col, i) => (
            <motion.div key={col.id} {...fadeProps(i * 0.08 + 0.06)}>
              <Link href={col.href} className="group block h-full">
                <article
                  className="flex flex-col h-full overflow-hidden transition-shadow duration-300 group-hover:shadow-md"
                  style={{
                    background: "var(--bg)",
                    borderRadius: "var(--radius-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Image frame — white */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: "#fff",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={col.image}
                        alt={col.title}
                        fill
                        className="object-contain p-10 transition-transform duration-500 group-hover:scale-[1.05]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
                    <p
                      className="text-[10px] uppercase tracking-widest mb-1.5 font-medium"
                      style={{ color: col.accentColor }}
                    >
                      {col.badge}
                    </p>
                    <h3
                      className="leading-snug mb-2"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "1.15rem",
                        color: "var(--text)",
                      }}
                    >
                      {col.title}
                    </h3>
                    <p
                      className="text-xs leading-relaxed mt-auto"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {col.description}
                    </p>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
