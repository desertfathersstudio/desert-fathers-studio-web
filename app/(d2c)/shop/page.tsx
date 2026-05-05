import { Nav } from "@/components/d2c/Nav";
import { CatalogSection } from "@/components/d2c/CatalogSection";
import { Footer } from "@/components/d2c/Footer";
import { CATALOG, type CategoryKey } from "@/lib/catalog";
import { createSupabaseServer } from "@/lib/supabase/server";

// Extract the base filename from an R2 URL (reverse of stickerImageUrl)
function r2UrlToFilenameBase(url: string): string {
  try {
    const encoded = new URL(url).pathname.split("/").pop() ?? "";
    return decodeURIComponent(encoded).replace(/\.[^.]+$/, "");
  } catch {
    return "";
  }
}

// Map catalog entries by filename base so we can look them up by R2 URL
const CATALOG_BY_FILENAME_BASE = new Map(
  CATALOG.map((s) => [s.filename.replace(/\.[^.]+$/, ""), s.name])
);

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
        .select("image_url, name")
        .eq("active", true)
        .eq("coming_soon", true),
    ]);
    soldOutNames = (productsRes.data ?? [])
      .filter((p: { name: string; inventory: { on_hand: number }[] }) => {
        const inv = p.inventory?.[0];
        return inv !== undefined && inv.on_hand === 0;
      })
      .map((p: { name: string }) => p.name);

    const catalogNameSet = new Set(CATALOG.map((s) => s.name));
    const resolved = new Set<string>();
    for (const p of (comingSoonRes.data ?? []) as { image_url: string | null; name: string }[]) {
      // Primary: direct name match against catalog
      if (catalogNameSet.has(p.name)) { resolved.add(p.name); continue; }
      // Fallback: R2 URL → filename base → catalog name
      const base = r2UrlToFilenameBase(p.image_url ?? "");
      const byFilename = CATALOG_BY_FILENAME_BASE.get(base);
      if (byFilename) resolved.add(byFilename);
    }
    comingSoonNames = [...resolved];
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
