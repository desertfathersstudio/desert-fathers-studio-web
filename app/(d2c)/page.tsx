import { Nav } from "@/components/d2c/Nav";
import { HeroSection } from "@/components/d2c/HeroSection";
import { FeaturedCollections } from "@/components/d2c/FeaturedCollections";
import { HomepageGrid } from "@/components/d2c/HomepageGrid";
import { ProductFeatures } from "@/components/d2c/ProductFeatures";
import { TrustSection } from "@/components/d2c/TrustSection";
import { Footer } from "@/components/d2c/Footer";
import { BookOpen, NotebookPen, Laptop, Droplets, Gift } from "lucide-react";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";

export default async function HomePage() {
  // One query to build imageMap + stripItems + featuredProducts for all homepage components
  let imageMap: Record<string, string> = {};
  let stripItems: { id: string; name: string; imageUrl: string }[] = [];
  let featuredProducts: { id: string; name: string; imageUrl: string; price: number }[] = [];

  try {
    const sb = createSupabaseService();
    const [activeRes, featuredRes] = await Promise.all([
      sb
        .from("products")
        .select("id, name, image_url, image_updated_at, retail_price")
        .eq("active", true)
        .eq("coming_soon", false),
      sb
        .from("products")
        .select("id, name, image_url, image_updated_at, retail_price")
        .eq("active", true)
        .eq("coming_soon", false)
        .eq("featured", true),
    ]);

    for (const row of activeRes.data ?? []) {
      const url = withVersion(row.image_url, row.image_updated_at);
      if (url) imageMap[row.name] = url;
    }

    stripItems = (activeRes.data ?? [])
      .filter((r) => r.image_url)
      .map((r) => ({
        id: String(r.id),
        name: String(r.name),
        imageUrl: withVersion(r.image_url, r.image_updated_at) ?? r.image_url,
      }));

    featuredProducts = (featuredRes.data ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      imageUrl: withVersion(r.image_url, r.image_updated_at) ?? "",
      price: Number(r.retail_price),
    }));
  } catch {
    // gracefully degrade — components fall back to catalog static data
  }

  return (
    <>
      <Nav />
      <main>
        <HeroSection imageMap={imageMap} stripItems={stripItems} />
        <FeaturedCollections imageMap={imageMap} />
        <HomepageGrid featuredProducts={featuredProducts} imageMap={imageMap} />
        <ProductFeatures />
        <UseCasesSection />
        <TrustSection />
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
              color: "var(--text-inverse)",
              letterSpacing: "-0.02em",
            }}
          >
            Take your faith with you.
          </h2>
          <div className="ci-heading-accent mt-5" style={{ background: "var(--gold-light)" }} />
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
                  color: "var(--text-inverse)",
                }}
              >
                {headline}
              </h3>
              <p
                className="text-xs leading-relaxed mt-auto pt-3"
                style={{ color: "rgba(var(--bg-rgb) / 0.5)" }}
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
