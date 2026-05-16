"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Shield, Truck, Heart } from "lucide-react";

const PILLARS = [
  {
    icon: Shield,
    title: "Durable & Waterproof",
    body: "Premium vinyl stickers that stand up to water bottles, Bibles, and everyday life.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    body: "Orders ship within 2–3 business days, carefully packed and protected.",
  },
  {
    icon: Heart,
    title: "Made with Care",
    body: "Each design is hand-crafted from authentic Coptic iconographic references.",
  },
] as const;

export function TrustSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const reduced = useReducedMotion();

  return (
    <section ref={ref} className="py-20 md:py-28" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          className="mb-12"
          initial={reduced ? {} : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55 }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
            style={{ color: "var(--gold)" }}
          >
            Why Desert Fathers Studio
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
            Stickers you can trust.
          </h2>
          <div className="ci-heading-accent mt-5" />
        </motion.div>

        {/* Ruled list — no card wrappers */}
        <div className="h-px ci-draw-scroll" style={{ background: "var(--border)" }} />
        <div
          className="grid sm:grid-cols-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                className={`flex gap-5 items-start py-8 sm:px-8 ${i > 0 ? "border-t sm:border-t-0 sm:border-l" : ""}`}
                style={i > 0 ? { borderColor: "var(--border)" } : undefined}
                initial={reduced ? {} : { opacity: 0, y: 24 }}
                animate={
                  inView
                    ? { opacity: 1, y: 0 }
                    : reduced
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 24 }
                }
                transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.09, ease: [0.23, 1, 0.32, 1] }}
              >
                <div
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full mt-0.5"
                  style={{ background: "var(--cream)" }}
                >
                  <Icon size={17} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
                </div>
                <div>
                  <h3
                    className="mb-1.5 font-medium"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.05rem",
                      color: "var(--text)",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {p.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
