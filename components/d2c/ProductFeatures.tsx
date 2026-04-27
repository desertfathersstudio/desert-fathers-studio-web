"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Droplets, Sparkles, Ruler, Layers } from "lucide-react";

const FEATURES = [
  {
    icon: Droplets,
    title: "Waterproof",
    body: "Survives water bottles, rain, and everyday life without peeling or fading.",
  },
  {
    icon: Sparkles,
    title: "Glossy Finish",
    body: "Rich, vibrant colors with a premium gloss coat that makes every icon shine.",
  },
  {
    icon: Ruler,
    title: "3 in · 8 cm",
    body: "The perfect size — large enough to see the detail, small enough to go anywhere.",
  },
  {
    icon: Layers,
    title: "Vinyl Stickers",
    body: "Durable die-cut vinyl that sticks clean and leaves no residue when removed.",
  },
] as const;

export function ProductFeatures() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const reduced = useReducedMotion();

  return (
    <section
      id="what-you-get"
      ref={ref}
      className="py-20 md:py-28"
      style={{ background: "var(--cream)", borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          className="mb-14"
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
            style={{ color: "var(--gold)" }}
          >
            What you get
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
              fontWeight: 400,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Made to last. Built to travel.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={reduced ? {} : { opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.08, ease: "easeOut" }}
                className="flex flex-col"
              >
                <div
                  className="w-11 h-11 flex items-center justify-center rounded-2xl mb-4"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <Icon size={20} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
                </div>
                <h3
                  className="font-medium mb-1.5"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.1rem",
                    color: "var(--text)",
                  }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
