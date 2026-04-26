import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center pt-16"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid md:grid-cols-[1fr_auto] gap-16 md:gap-24 items-center">

          {/* Text column */}
          <div className="max-w-xl">
            <p
              className="reveal reveal-1 text-[11px] uppercase tracking-[0.2em] font-medium mb-6"
              style={{ color: "var(--gold)" }}
            >
              Coptic Orthodox Icon Stickers
            </p>

            <h1
              className="reveal reveal-2 leading-[1.1] mb-8"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 300,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              Sacred art
              <br />
              <em style={{ color: "var(--brand)", fontStyle: "italic" }}>for every</em>
              <br />
              faithful heart.
            </h1>

            <p
              className="reveal reveal-3 text-lg leading-relaxed mb-10"
              style={{ color: "var(--text-muted)", maxWidth: "38ch" }}
            >
              Hand-designed icon stickers rooted in Coptic tradition — for your Bible,
              planner, water bottle, or anywhere faith travels with you.
            </p>

            <div className="reveal reveal-4 flex flex-wrap items-center gap-4">
              <Link
                href="#catalog"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-medium text-sm transition-opacity hover:opacity-85"
                style={{
                  background: "var(--brand)",
                  color: "#fff",
                  borderRadius: "var(--radius-btn)",
                }}
              >
                Browse the catalog
              </Link>
              <Link
                href="#story"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                Our story →
              </Link>
            </div>

            {/* Social proof */}
            <p
              className="reveal reveal-4 mt-10 text-xs"
              style={{ color: "var(--text-muted)", opacity: 0.7 }}
            >
              Handmade in Chicago · Trusted by Coptic Sunday schools across the US
            </p>
          </div>

          {/* Image cluster */}
          <div className="hidden md:block relative w-[380px] h-[480px] shrink-0">
            {/* Main sticker */}
            <div
              className="absolute top-0 right-0 w-64 h-64 overflow-hidden shadow-xl"
              style={{
                borderRadius: "16px",
                transform: "rotate(2deg)",
                background: "var(--bg-card)",
              }}
            >
              <Image
                src="https://placehold.co/512x512/f5f0e8/6b1d3b?text=☩"
                alt="Featured Coptic icon sticker"
                fill
                className="object-contain p-8"
                priority
              />
            </div>

            {/* Second sticker */}
            <div
              className="absolute bottom-12 left-0 w-52 h-52 overflow-hidden shadow-lg"
              style={{
                borderRadius: "14px",
                transform: "rotate(-3deg)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <Image
                src="https://placehold.co/400x400/faf7f2/b5853a?text=✦"
                alt="Coptic icon sticker"
                fill
                className="object-contain p-6"
              />
            </div>

            {/* Accent label */}
            <span
              className="absolute bottom-4 right-8 text-xs font-medium px-3 py-1.5"
              style={{
                background: "var(--gold-light)",
                color: "#fff",
                borderRadius: "999px",
                fontFamily: "var(--font-inter)",
              }}
            >
              70¢ per sticker
            </span>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "var(--border)" }}
      />
    </section>
  );
}
