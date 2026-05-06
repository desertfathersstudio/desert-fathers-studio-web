import { notFound } from "next/navigation";
import { Nav } from "@/components/d2c/Nav";
import { PackDetail } from "@/components/d2c/PackDetail";
import { Footer } from "@/components/d2c/Footer";
import { createSupabaseService } from "@/lib/supabase/service";
import { withVersion } from "@/lib/image-version";
import { CATALOG } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const VALID_SLUGS = ["holy-week-pack", "resurrection-pack"];

const SLUG_TO_CATEGORY: Record<string, string> = {
  "holy-week-pack": "holy-week",
  "resurrection-pack": "resurrection",
};

const SLUG_TO_PACK_NAME: Record<string, string> = {
  "holy-week-pack": "Holy Week Pack",
  "resurrection-pack": "Resurrection Pack",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const names: Record<string, string> = {
    "holy-week-pack": "Holy Week Pack",
    "resurrection-pack": "Resurrection Pack",
  };
  const name = names[slug];
  if (!name) return {};
  return {
    title: name,
    description: `${name} — Coptic Orthodox icon stickers from Desert Fathers Studio.`,
  };
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  const category = SLUG_TO_CATEGORY[slug];
  const packName = SLUG_TO_PACK_NAME[slug];

  // Collect names we need versioned images for: the pack itself + all stickers in this category
  const packStickerNames = CATALOG
    .filter((s) => s.category === category)
    .map((s) => s.name);
  const namesToFetch = [packName, ...packStickerNames];

  let imageMap: Record<string, string> = {};
  let availableIndividually = new Set<string>();
  let packComingSoon = false;
  try {
    const sb = createSupabaseService();
    const [{ data: imgData }, { data: indivData }] = await Promise.all([
      sb.from("products").select("name, image_url, image_updated_at, coming_soon").in("name", namesToFetch),
      sb.from("products").select("name").eq("active", true).eq("coming_soon", false)
        .not("name", "in", "(Holy Week Pack,Resurrection Pack)"),
    ]);

    for (const row of imgData ?? []) {
      const url = withVersion(row.image_url, row.image_updated_at);
      if (url) imageMap[row.name] = url;
    }
    packComingSoon =
      (imgData?.find((r) => r.name === packName) as { coming_soon?: boolean } | undefined)
        ?.coming_soon ?? false;
    for (const row of indivData ?? []) {
      if (row.name) availableIndividually.add(row.name as string);
    }
  } catch {
    // gracefully degrade
  }

  return (
    <>
      <Nav />
      <main className="pt-16">
        <PackDetail slug={slug} imageMap={imageMap} availableIndividually={availableIndividually} comingSoon={packComingSoon} />
      </main>
      <Footer />
    </>
  );
}
