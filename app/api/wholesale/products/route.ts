import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";
import { getServerAccountByAccountId } from "@/lib/wholesale/accounts-server";
import {
  getPackType,
  isStandalonePackDesign,
  categoryBgColor,
  categoryTextColor,
  productImageUrl,
} from "@/lib/wholesale/pricing";
import { withVersion } from "@/lib/image-version";
import type { WholesaleProduct } from "@/types/wholesale";

export async function GET(req: NextRequest) {
  // SECURITY: validate server-side session cookie
  const sessionAccountId = getSessionAccountId(req);
  if (!sessionAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = sessionAccountId; // use session, not client-supplied param
  if (!ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("products")
      .select("id, sku, name, size, image_url, image_updated_at, drive_link, review_status, review_comments, created_at, can_buy_individually, categories(name)")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch pack metadata (wholesale_price + pack_size) for all PK-# products
    // from sticker_packs. pack_size is used to set "Set of N" on cart lines so
    // sticker counting works automatically for any new pack without code changes.
    const allPackSkus = (data ?? [])
      .map((r) => String(r.sku ?? "").toUpperCase())
      .filter((s) => /^PK-\d+$/.test(s));

    const packWholesalePrices: Record<string, number> = {};
    const packSizes: Record<string, number> = {};
    if (allPackSkus.length > 0) {
      const { data: packMeta } = await sb
        .from("sticker_packs")
        .select("sku, wholesale_price, pack_size")
        .in("sku", allPackSkus);
      for (const pm of packMeta ?? []) {
        const s = String(pm.sku).toUpperCase();
        if (pm.wholesale_price != null) packWholesalePrices[s] = Number(pm.wholesale_price);
        if (pm.pack_size       != null) packSizes[s]           = Number(pm.pack_size);
      }
    }
    const accountConfig = getServerAccountByAccountId(accountId);
    const accountPackPrices = accountConfig?.packPrices ?? {};

    const cacheBust = String(Date.now());
    // Only designs added after this date get the "New" badge going forward
    const NEW_BADGE_CUTOFF = new Date("2026-04-30T00:00:00Z").getTime();

    const products: WholesaleProduct[] = (data ?? []).flatMap((row) => {
      const categoriesRaw = row.categories as { name: string }[] | { name: string } | null;
      const category = Array.isArray(categoriesRaw)
        ? (categoriesRaw[0]?.name ?? "")
        : (categoriesRaw?.name ?? "");

      const sku = String(row.sku ?? "");
      const name = String(row.name ?? "");
      const skuUp = sku.toUpperCase();
      const isPackProduct =
        skuUp === "RP_PACK" || skuUp === "HWP_PACK" ||
        /^PK-\d+$/.test(skuUp);

      const packType = getPackType(name, category, sku);
      const standalonePackDesign = isStandalonePackDesign(name);
      const packOnly =
        !!packType && !standalonePackDesign && !isPackProduct;

      const rawImageUrl = productImageUrl(
        row.image_url as string | null,
        row.drive_link as string | null,
        "w800",
        cacheBust
      );
      const imageUrl = withVersion(rawImageUrl, row.image_updated_at as string | null) ?? rawImageUrl;

      const dateAdded = row.created_at as string;
      const isNew = new Date(dateAdded).getTime() > NEW_BADGE_CUTOFF;

      // For PK-# packs, embed wholesale price (account override → DB price)
      // and pack_size so the cart can set "Set of N" automatically.
      const isDbPack = isPackProduct && /^PK-\d+$/.test(skuUp);
      const isGenericPack = isDbPack && !packType; // PK-3+ (not RP/HWP)
      const wholesalePrice = isGenericPack
        ? (accountPackPrices[skuUp] ?? packWholesalePrices[skuUp])
        : undefined;
      const packSize = isDbPack ? packSizes[skuUp] : undefined;

      return [{
        id: String(row.id),
        sku,
        name,
        category,
        size: String(row.size ?? ""),
        imageUrl,
        reviewStatus: (row.review_status as WholesaleProduct["reviewStatus"]) ?? "approved",
        reviewComments: String(row.review_comments ?? ""),
        dateAdded,
        packType,
        packOnly,
        standalonePackDesign,
        isPackProduct,
        categoryBg: categoryBgColor(category),
        categoryText: categoryTextColor(category),
        isNew,
        ...(wholesalePrice !== undefined ? { wholesalePrice } : {}),
        ...(packSize       !== undefined ? { packSize }       : {}),
      }];
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[wholesale/products]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
