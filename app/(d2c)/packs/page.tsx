export const dynamic = "force-dynamic";

import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";
import { PacksGrid } from "@/components/d2c/PacksGrid";
import { SKU_TO_SLUG, PACK_CONFIGS, PACK_CONSTITUENT_DB_CATEGORY } from "@/lib/pack-configs";
import { CATALOG, type Sticker } from "@/lib/catalog";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";
import { D2C_PRICE } from "@/lib/pricing";

export default async function PacksPage() {
  let packs: Sticker[] = [];
  const availability: Record<string, number | null> = {};

  try {
    const sb = createSupabaseService();

    const [{ data: packRows }, { data: catRows }] = await Promise.all([
      sb.from("products")
        .select("name, sku, retail_price, image_url, image_updated_at")
        .in("sku", ["PK-1", "PK-2"])
        .eq("active", true)
        .eq("coming_soon", false),
      sb.from("categories")
        .select("id, name")
        .in("name", ["Holy Week", "Resurrection"]),
    ]);

    for (const row of packRows ?? []) {
      const slug = SKU_TO_SLUG[row.sku as string];
      if (!slug) continue;
      const catalogEntry = CATALOG.find((c) => c.name === row.name);
      const url = withVersion(
        row.image_url as string | null,
        row.image_updated_at as string | null
      );
      packs.push({
        id: slug,
        name: row.name as string,
        filename: catalogEntry?.filename ?? "",
        imageUrl: url ?? undefined,
        price: Number(row.retail_price ?? catalogEntry?.price ?? D2C_PRICE),
        category: "packs",
        isPack: true,
        packSize: catalogEntry?.packSize,
      });
    }

    packs.sort((a, b) => {
      const order = ["holy-week-pack", "resurrection-pack"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

    // Derive availability from MIN(on_hand) across each pack's constituent stickers
    const catIdMap: Record<string, string> = {};
    for (const cat of catRows ?? []) catIdMap[cat.name as string] = cat.id as string;

    await Promise.all(
      packs.map(async (pack) => {
        const packConfig = PACK_CONFIGS[pack.id];
        if (!packConfig) return;
        const dbCatName = PACK_CONSTITUENT_DB_CATEGORY[packConfig.category];
        const catId = dbCatName ? catIdMap[dbCatName] : undefined;
        if (!catId) return;

        const { data: products } = await sb
          .from("products")
          .select("inventory(on_hand)")
          .eq("category_id", catId)
          .eq("active", true)
          .eq("coming_soon", false);

        const onHands = (products ?? []).flatMap((p) => {
          const inv = (p.inventory as { on_hand: number }[] | null)?.[0];
          return inv !== undefined ? [inv.on_hand] : [];
        });

        availability[pack.id] = onHands.length > 0 ? Math.min(...onHands) : null;
      })
    );
  } catch (err) {
    console.error("[packs] error fetching packs:", err);
    packs = CATALOG.filter((s) => s.isPack);
  }

  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <div
          className="pt-28 pb-12 px-6 md:px-10"
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
              Sticker Packs
            </h1>
            <p
              className="max-w-lg mt-3 text-sm leading-relaxed"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            >
              Curated sets for the sacred seasons — each pack tells a complete story from Coptic iconography.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <PacksGrid packs={packs} availability={availability} />
        </div>
      </main>
      <Footer />
    </>
  );
}
