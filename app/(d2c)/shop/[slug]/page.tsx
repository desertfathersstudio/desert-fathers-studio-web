import { notFound } from "next/navigation";
import { Nav } from "@/components/d2c/Nav";
import { PackDetail } from "@/components/d2c/PackDetail";
import { Footer } from "@/components/d2c/Footer";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = createSupabaseService();
  const { data } = await sb
    .from("sticker_packs")
    .select("name")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!data?.name) return {};
  return {
    title: data.name as string,
    description: `${data.name} — Coptic Orthodox icon stickers from Desert Fathers Studio.`,
  };
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = createSupabaseService();

  // 1. Look up the pack by slug (DB-driven — no hardcoded VALID_SLUGS)
  const { data: packMeta } = await sb
    .from("sticker_packs")
    .select("id, name, sku, slug, description, accent_color, pack_size, retail_price")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!packMeta) notFound();

  let imageMap: Record<string, string> = {};
  let stickerNames: string[] = [];
  let availableIndividually = new Set<string>();
  let packComingSoon = false;

  try {
    // 2. Fetch pack product row (for image + coming_soon flag) and constituent stickers in parallel
    const [{ data: packProduct }, { data: constituentProducts }] = await Promise.all([
      sb.from("products")
        .select("name, image_url, image_updated_at, coming_soon")
        .eq("sku", packMeta.sku as string)
        .maybeSingle(),
      sb.from("products")
        .select("name, image_url, image_updated_at, can_buy_individually")
        .eq("pack_id", packMeta.id as string)
        .eq("active", true),
    ]);

    // Build image map: pack product cover + all constituent sticker images
    if (packProduct) {
      const url = withVersion(
        packProduct.image_url as string | null,
        packProduct.image_updated_at as string | null,
      );
      if (url) imageMap[packMeta.name as string] = url;
      packComingSoon = (packProduct.coming_soon as boolean) ?? false;
    }

    for (const row of constituentProducts ?? []) {
      const url = withVersion(
        row.image_url as string | null,
        row.image_updated_at as string | null,
      );
      if (url && row.name) imageMap[row.name as string] = url;
    }

    // Build sticker names and individually-available set from constituent products
    stickerNames = (constituentProducts ?? []).map((p) => p.name as string).filter(Boolean);
    for (const p of constituentProducts ?? []) {
      if (p.can_buy_individually && p.name) {
        availableIndividually.add(p.name as string);
      }
    }
  } catch (err) {
    console.error(`[shop/${slug}] error fetching pack detail:`, err);
  }

  const packData = {
    name:               packMeta.name as string,
    description:        (packMeta.description as string | null) ?? "",
    accentColor:        (packMeta.accent_color as string | null) ?? "var(--brand)",
    packSize:           stickerNames.length || (packMeta.pack_size as number | null) || 0,
    retailPrice:        Number(packMeta.retail_price ?? 0),
  };

  return (
    <>
      <Nav />
      <main className="pt-16">
        <PackDetail
          slug={slug}
          imageMap={imageMap}
          availableIndividually={availableIndividually}
          comingSoon={packComingSoon}
          packData={packData}
          stickerNames={stickerNames}
        />
      </main>
      <Footer />
    </>
  );
}
