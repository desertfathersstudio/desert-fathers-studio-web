export const dynamic = "force-dynamic";

import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";
import { PacksGrid } from "@/components/d2c/PacksGrid";
import { SKU_TO_SLUG } from "@/lib/pack-configs";
import { CATALOG, type Sticker } from "@/lib/catalog";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";
import { D2C_PRICE } from "@/lib/pricing";

export default async function PacksPage() {
  let packs: Sticker[] = [];

  try {
    const sb = createSupabaseService();

    // diagnostic: dump all non-null SKUs so we can see actual values
    const { data: allSkus } = await sb.from("products").select("name, sku, active").not("sku", "is", null);
    console.log("[packs] all non-null skus:", JSON.stringify(allSkus));

    const { data, error } = await sb
      .from("products")
      .select("name, sku, retail_price, image_url, image_updated_at")
      .in("sku", ["HWP_PACK", "RP_PACK"])
      .eq("active", true);
    console.log("[packs] query returned:", data?.length ?? 0, "rows, error:", error?.message ?? "none");

    for (const row of data ?? []) {
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
          <PacksGrid packs={packs} />
        </div>
      </main>
      <Footer />
    </>
  );
}
