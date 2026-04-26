import Link from "next/link";

export function BrandStory() {
  return (
    <section
      id="story"
      className="py-20 md:py-28"
      style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start">

          <div className="md:sticky md:top-28">
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-6"
              style={{ color: "var(--gold)" }}
            >
              About
            </p>
            <blockquote
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 300,
                lineHeight: 1.3,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              "Every icon is a window — not a painting to admire, but a{" "}
              <em style={{ color: "var(--brand)" }}>presence to encounter.</em>"
            </blockquote>
          </div>

          <div
            className="space-y-5"
            style={{ color: "var(--text-muted)", lineHeight: 1.8, maxWidth: "52ch" }}
          >
            <p>
              Desert Fathers Studio brings Coptic iconography into everyday life. Each sticker
              is hand-designed from authentic icon references — for Bibles, planners, and
              anywhere faith travels with you.
            </p>
            <p>
              We design for Sunday schools, Coptic families, and anyone who finds beauty in the
              ancient Egyptian Christian tradition.{" "}
              <Link
                href="/wholesale"
                className="transition-opacity hover:opacity-60"
                style={{
                  color: "var(--brand)",
                  textDecoration: "underline",
                  textDecorationColor: "var(--border-dark)",
                }}
              >
                Wholesale pricing available.
              </Link>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
