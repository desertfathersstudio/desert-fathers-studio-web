import { Nav } from "@/components/d2c/Nav";
import { CatalogSection } from "@/components/d2c/CatalogSection";
import { Footer } from "@/components/d2c/Footer";
import { type CategoryKey } from "@/lib/catalog";
import { createSupabaseServer } from "@/lib/supabase/server";

const VALID_CATEGORIES: CategoryKey[] = [
  "individuals", "packs", "christ", "our-lady", "angels", "saints",
  "prophets", "scenes", "holy-week", "resurrection",
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const category = VALID_CATEGORIES.includes(categoryParam as CategoryKey)
    ? (categoryParam as CategoryKey)
    : undefined;

  let soldOutNames: string[] = [];
  let comingSoonNames: string[] = [];
  try {
    const sb = await createSupabaseServer();
    const [productsRes, comingSoonRes] = await Promise.all([
      sb
        .from("products")
        .select("name, inventory(on_hand)")
        .eq("active", true)
        .eq("coming_soon", false),
      sb
        .from("products")
        .select("name")
        .eq("active", true)
        .eq("coming_soon", true),
    ]);
    soldOutNames = (productsRes.data ?? [])
      .filter((p: { name: string; inventory: { on_hand: number }[] }) => {
        const inv = p.inventory?.[0];
        return inv !== undefined && inv.on_hand === 0;
      })
      .map((p: { name: string }) => p.name);
    comingSoonNames = (comingSoonRes.data ?? []).map((p: { name: string }) => p.name);
  } catch {
    // gracefully degrade if DB is unavailable
  }

  return (
    <>
      <Nav />
      <main>
        {/* Page header */}
        <div
          className="pt-28 pb-10 px-6 md:px-10"
          style={{
            background: "var(--cream)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <p
              className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
              style={{ color: "var(--gold)" }}
            >
              Desert Fathers Studio
            </p>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {category
                ? `${categoryParam?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
                : "All Stickers"}
            </h1>
          </div>
        </div>

        <CatalogSection initialCategory={category} soldOutNames={soldOutNames} comingSoonNames={comingSoonNames} />
      </main>
      <Footer />
    </>
  );
}
