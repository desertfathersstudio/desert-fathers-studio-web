import { Nav } from "@/components/d2c/Nav";
import { CatalogSection } from "@/components/d2c/CatalogSection";
import { Footer } from "@/components/d2c/Footer";
import { type CategoryKey } from "@/lib/catalog";

const VALID_CATEGORIES: CategoryKey[] = [
  "packs", "christ", "our-lady", "angels", "saints",
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

        <CatalogSection initialCategory={category} />
      </main>
      <Footer />
    </>
  );
}
