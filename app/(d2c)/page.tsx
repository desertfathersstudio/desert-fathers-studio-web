import Link from "next/link";
import { Nav } from "@/components/d2c/Nav";
import { HeroSection } from "@/components/d2c/HeroSection";
import { FeaturedCollections } from "@/components/d2c/FeaturedCollections";
import { TrustSection } from "@/components/d2c/TrustSection";
import { BrandStory } from "@/components/d2c/BrandStory";
import { Footer } from "@/components/d2c/Footer";
import { HomepageGrid } from "@/components/d2c/HomepageGrid";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturedCollections />
        <HomepageGrid />
        <UseCaseStrip />
        <TrustSection />
        <BrandStory />
      </main>
      <Footer />
    </>
  );
}

function UseCaseStrip() {
  return (
    <section
      className="py-16 md:py-20"
      style={{ background: "var(--cream)", borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
        {/* Gold hairline divider */}
        <div
          className="mx-auto mb-8 h-px w-16"
          style={{ background: "var(--gold)", opacity: 0.5 }}
          aria-hidden
        />

        <p
          className="text-[11px] uppercase tracking-[0.28em] font-medium mb-4"
          style={{ color: "var(--gold)" }}
        >
          Perfect for
        </p>

        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 300,
            color: "var(--text)",
            lineHeight: 1.5,
            letterSpacing: "-0.01em",
          }}
        >
          Sunday school classrooms, thoughtful gifts,
          <br className="hidden sm:block" /> church bookstores, and{" "}
          <em style={{ color: "var(--brand)", fontStyle: "italic" }}>
            personal devotion
          </em>
          .
        </p>

        <div
          className="mx-auto mt-8 h-px w-16"
          style={{ background: "var(--gold)", opacity: 0.5 }}
          aria-hidden
        />
      </div>
    </section>
  );
}
