import { Nav } from "@/components/d2c/Nav";
import { HeroSection } from "@/components/d2c/HeroSection";
import { FeaturedCollections } from "@/components/d2c/FeaturedCollections";
import { HomepageGrid } from "@/components/d2c/HomepageGrid";
import { ProductFeatures } from "@/components/d2c/ProductFeatures";
import { TrustSection } from "@/components/d2c/TrustSection";
import { BrandStory } from "@/components/d2c/BrandStory";
import { Footer } from "@/components/d2c/Footer";
import { BookOpen, NotebookPen, Laptop, Droplets, Gift } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturedCollections />
        <HomepageGrid />
        <ProductFeatures />
        <UseCasesSection />
        <TrustSection />
        <BrandStory />
      </main>
      <Footer />
    </>
  );
}

const USE_CASES = [
  {
    icon: BookOpen,
    label: "Bible",
    headline: "Keep it where you read.",
    body: "Add a small reminder to the pages you return to most.",
  },
  {
    icon: NotebookPen,
    label: "Planner",
    headline: "Start your week with purpose.",
    body: "A simple habit that keeps you grounded through the week.",
  },
  {
    icon: Laptop,
    label: "MacBook",
    headline: "A quiet reminder at your desk.",
    body: "Faith doesn't stay at church — it follows you into your work.",
  },
  {
    icon: Droplets,
    label: "Water Bottle",
    headline: "Made to go with you.",
    body: "Durable, simple, and built for everyday use.",
  },
  {
    icon: Gift,
    label: "Gifts",
    headline: "Give something that lasts.",
    body: "Thoughtful, personal, and easy to share.",
  },
] as const;

function UseCasesSection() {
  return (
    <section
      className="py-20 md:py-28"
      style={{ background: "var(--navy)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Heading */}
        <div className="mb-14 md:mb-16">
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
            style={{ color: "var(--gold)" }}
          >
            Put your faith everywhere
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
              fontWeight: 300,
              color: "#F8F4EC",
              letterSpacing: "-0.01em",
            }}
          >
            Take your faith with you.
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {USE_CASES.map(({ icon: Icon, label, headline, body }) => (
            <div
              key={label}
              className="flex flex-col p-6 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center rounded-xl mb-5"
                style={{ background: "rgba(184,137,62,0.18)", border: "1px solid rgba(184,137,62,0.25)" }}
              >
                <Icon size={18} style={{ color: "var(--gold)" }} strokeWidth={1.5} />
              </div>
              <p
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "var(--gold)", opacity: 0.8 }}
              >
                {label}
              </p>
              <h3
                className="leading-snug mb-2"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.05rem",
                  fontWeight: 400,
                  color: "#F8F4EC",
                }}
              >
                {headline}
              </h3>
              <p
                className="text-xs leading-relaxed mt-auto pt-3"
                style={{ color: "rgba(248,244,236,0.5)" }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
