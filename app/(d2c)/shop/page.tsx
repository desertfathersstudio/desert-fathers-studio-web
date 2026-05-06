import { Nav } from "@/components/d2c/Nav";
import { CatalogSection } from "@/components/d2c/CatalogSection";
import { Footer } from "@/components/d2c/Footer";
import { CATALOG, type CategoryKey, type Sticker } from "@/lib/catalog";
import { D2C_PRICE } from "@/lib/pricing";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";

const VALID_CATEGORIES: CategoryKey[] = [
  "individuals", "packs", "christ", "our-lady", "angels", "saints",
  "prophets", "scenes", "holy-week", "resurrection",
];

const DB_CATEGORY_TO_KEY: Record<string, Exclude<CategoryKey, "all" | "individuals">> = {
  "Packs":                  "packs",
  "Christ":                 "christ",
  "Our Lady":               "our-lady",
  "Angels":                 "angels",
  "Saints":                 "saints",
  "Prophets & Patriarchs":  "prophets",
  "Scenes":                 "scenes",
  "Holy Week":              "holy-week",
  "Resurrection":           "resurrection",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const category = VALID_CATEGORIES.includes(categoryParam as CategoryKey)
    ? (categoryParam as CategoryKey)
    : undefined;

  let products: Sticker[] = [];
  let soldOutNames: string[] = [];
  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("products")
      .select("name, retail_price, image_url, image_updated_at, categories(name), inventory(on_hand)")
      .eq("active", true)
      .eq("coming_soon", false);
    if (error) throw error;

    for (const row of data ?? []) {
      const catalogEntry = CATALOG.find((c) => c.name === row.name);

      const categoriesRaw = row.categories as { name: string }[] | { name: string } | null;
      const dbCategoryName = Array.isArray(categoriesRaw)
        ? categoriesRaw[0]?.name
        : (categoriesRaw as { name: string } | null)?.name;

      const productCategory: Exclude<CategoryKey, "all"> =
        catalogEntry?.category ??
        (dbCategoryName ? DB_CATEGORY_TO_KEY[dbCategoryName] : undefined) ??
        "saints";

      const inv = (row.inventory as { on_hand: number }[] | null)?.[0];
      if (inv !== undefined && inv !== null && inv.on_hand === 0) {
        soldOutNames.push(row.name as string);
      }

      products.push({
        id: catalogEntry?.id ?? (row.name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: row.name as string,
        filename: catalogEntry?.filename ?? "",
        imageUrl: withVersion(row.image_url as string | null, row.image_updated_at as string | null) ?? undefined,
        price: Number(row.retail_price ?? catalogEntry?.price ?? D2C_PRICE),
        category: productCategory,
        isPack: catalogEntry?.isPack,
        packSize: catalogEntry?.packSize,
        packOnly: catalogEntry?.packOnly,
        isNew: catalogEntry?.isNew,
      });
    }
  } catch (err) {
    console.error("[shop] error fetching products:", err);
  }

  // Packs have their own /packs page
  products = products.filter((p) => !p.isPack);

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

        <CatalogSection initialCategory={category} soldOutNames={soldOutNames} products={products} />
      </main>
      <Footer />
    </>
  );
}
