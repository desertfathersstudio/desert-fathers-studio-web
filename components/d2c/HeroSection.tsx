import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative flex items-center pt-16"
      style={{ background: "var(--bg)", minHeight: "62vh" }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-[1fr_auto] gap-12 md:gap-20 items-center">

          {/* Text column */}
          <div className="max-w-lg">
            <p
              className="reveal reveal-1 text-[11px] uppercase tracking-[0.2em] font-medium mb-5"
              style={{ color: "var(--gold)" }}
            >
              Coptic Orthodox Icon Stickers
            </p>

            <h1
              className="reveal reveal-2 leading-[1.1] mb-6"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
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
              className="reveal reveal-3 leading-relaxed mb-8"
              style={{ color: "var(--text-muted)", maxWidth: "38ch", fontSize: "1rem" }}
            >
              Hand-designed icon stickers rooted in Coptic tradition — for your Bible,
              planner, water bottle, or anywhere faith travels with you.
            </p>

            <div className="reveal reveal-4 flex flex-wrap items-center gap-4">
              <Link
                href="#catalog"
                className="inline-flex items-center gap-2 px-6 py-3 font-medium text-sm transition-opacity hover:opacity-85"
                style={{
                  background: "var(--brand)",
                  color: "var(--text-inverse)",
                  borderRadius: "var(--radius-btn)",
                }}
              >
                Browse the catalog
              </Link>
              <Link
                href="#story"
                className="text-sm font-medium transition-opacity hover:opacity-60"
                style={{ color: "var(--text-muted)" }}
              >
                Our story →
              </Link>
            </div>

            <p
              className="reveal reveal-4 mt-8 text-xs"
              style={{ color: "var(--text-muted)", opacity: 0.6 }}
            >
              Handmade in Chicago · Trusted by Coptic Sunday schools across the US
            </p>
          </div>

          {/* Image cluster */}
          <div className="hidden md:block relative w-[300px] h-[380px] shrink-0">
            <div
              className="absolute top-0 right-0 w-56 h-56 overflow-hidden shadow-lg"
              style={{
                borderRadius: "14px",
                transform: "rotate(2deg)",
                background: "var(--bg-card)",
              }}
            >
              <Image
                src="/stickers/Pantokrator.png"
                alt="Pantokrator — Christ the Almighty, Coptic icon sticker"
                fill
                className="object-contain p-7"
                priority
              />
            </div>

            <div
              className="absolute bottom-8 left-0 w-44 h-44 overflow-hidden shadow-md"
              style={{
                borderRadius: "12px",
                transform: "rotate(-3deg)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <Image
                src="/stickers/Ti Theotokos.png"
                alt="Ti Theotokos — the Mother of God, Coptic icon sticker"
                fill
                className="object-contain p-5"
              />
            </div>

            <span
              className="absolute bottom-2 right-6 text-xs font-medium px-3 py-1.5"
              style={{
                background: "var(--gold-light)",
                color: "var(--text-inverse)",
                borderRadius: "999px",
                fontFamily: "var(--font-sans)",
              }}
            >
              70¢ per sticker
            </span>
          </div>

        </div>
      </div>

      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "var(--border)" }}
      />
    </section>
  );
}
