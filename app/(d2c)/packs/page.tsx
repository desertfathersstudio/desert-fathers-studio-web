export const dynamic = "force-dynamic";

import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";
import { PacksGrid } from "@/components/d2c/PacksGrid";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";
import type { Sticker } from "@/lib/catalog";

export default async function PacksPage() {
  let packs: Sticker[] = [];
  const availability: Record<string, number | null> = {};

  try {
    const sb = createSupabaseService();

    // 1. Fetch all active packs from sticker_packs (DB-driven, no hardcoded SKUs)
    const { data: stickerPacks } = await sb
      .from("sticker_packs")
      .select("id, name, sku, slug, description, accent_color, pack_size, retail_price")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (!stickerPacks?.length) {
      return renderPage(packs, availability);
    }

    const packSkus  = stickerPacks.map((p) => p.sku as string).filter(Boolean);
    const packIds   = stickerPacks.map((p) => p.id as string);

    // 2. Fetch pack product rows (for image_url, coming_soon, actual retail_price)
    // 3. Fetch all constituent sticker products for availability in one query
    const [{ data: productRows }, { data: constituentProducts }] = await Promise.all([
      sb.from("products")
        .select("sku, name, image_url, image_updated_at, retail_price, coming_soon")
        .in("sku", packSkus)
        .eq("active", true),
      sb.from("products")
        .select("pack_id, inventory(on_hand)")
        .in("pack_id", packIds)
        .eq("active", true)
        .eq("coming_soon", false),
    ]);

    // Index product rows by SKU for fast lookup
    const productBySku = new Map<string, typeof productRows extends (infer T)[] | null ? T : never>();
    for (const row of productRows ?? []) {
      if (row.sku) productBySku.set(row.sku as string, row);
    }

    // Compute per-pack availability: MIN(on_hand) across constituent stickers
    const onHandsByPackId = new Map<string, number[]>();
    for (const row of constituentProducts ?? []) {
      const pid = row.pack_id as string;
      if (!pid) continue;
      const inv = (row.inventory as { on_hand: number }[] | { on_hand: number } | null);
      const onHand = Array.isArray(inv) ? inv[0]?.on_hand : inv?.on_hand;
      if (onHand !== undefined) {
        if (!onHandsByPackId.has(pid)) onHandsByPackId.set(pid, []);
        onHandsByPackId.get(pid)!.push(onHand);
      }
    }

    // Build Sticker[] for PacksGrid
    for (const pack of stickerPacks) {
      const slug = pack.slug as string;
      if (!slug) continue;

      const productRow = productBySku.get(pack.sku as string);

      const imageUrl = productRow
        ? (withVersion(productRow.image_url as string | null, productRow.image_updated_at as string | null) ?? undefined)
        : undefined;

      const price = Number(productRow?.retail_price ?? pack.retail_price ?? 0);
      const onHands = onHandsByPackId.get(pack.id as string) ?? [];

      packs.push({
        id: slug,
        name: pack.name as string,
        filename: "",
        imageUrl,
        price,
        category: "packs",
        isPack: true,
        packSize: pack.pack_size as number | undefined,
        description: (pack.description as string | null) ?? undefined,
        accentColor: (pack.accent_color as string | null) ?? undefined,
      });

      availability[slug] = onHands.length > 0 ? Math.min(...onHands) : null;
    }
  } catch (err) {
    console.error("[packs] error fetching packs:", err);
  }

  return renderPage(packs, availability);
}

function renderPage(packs: Sticker[], availability: Record<string, number | null>) {
  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <div
          className="pt-28 pb-12 px-6 md:px-10"
          style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}
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
