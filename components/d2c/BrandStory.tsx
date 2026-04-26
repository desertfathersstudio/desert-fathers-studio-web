export function BrandStory() {
  return (
    <section
      id="story"
      className="py-24 md:py-36"
      style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-32 items-start">

          {/* Pull quote */}
          <div className="md:sticky md:top-28">
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-8"
              style={{ color: "var(--gold)" }}
            >
              Our Story
            </p>
            <blockquote
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 300,
                lineHeight: 1.25,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              "Every icon is a window — not a painting to admire, but a{" "}
              <em style={{ color: "var(--brand)" }}>presence to encounter.</em>"
            </blockquote>
          </div>

          {/* Body text */}
          <div className="space-y-6" style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            <p>
              Desert Fathers Studio began as a simple wish: to bring the richness of Coptic
              iconography into everyday life — not locked behind glass in a church hall, but
              tucked into a Bible, pressed onto a planner, carried everywhere.
            </p>
            <p>
              Each sticker is hand-designed from authentic Coptic icon references. The saints,
              angels, and Gospel scenes we grew up venerating now travel with us. They belong
              on the things we use, the places we go, the people we love.
            </p>
            <p>
              We design for Sunday schools that need budget-friendly faith tools, for Coptic
              families who want their homes to breathe iconography, and for anyone who finds
              beauty in the ancient Egyptian Christian tradition.
            </p>

            <div
              className="mt-10 pt-8 grid grid-cols-3 gap-6 text-center"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {[
                { value: "60+", label: "Designs" },
                { value: "70¢", label: "Per sticker" },
                { value: "∞", label: "Sunday schools served" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "2rem",
                      fontWeight: 400,
                      color: "var(--brand)",
                    }}
                  >
                    {value}
                  </p>
                  <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
