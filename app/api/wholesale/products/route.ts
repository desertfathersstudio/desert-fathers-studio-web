import { NextRequest, NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import { ALL_ACCOUNT_IDS } from "@/config/wholesale-accounts";
import {
  getPackType,
  isStandalonePackDesign,
  categoryBgColor,
  categoryTextColor,
  productImageUrl,
} from "@/lib/wholesale/pricing";
import type { WholesaleProduct } from "@/types/wholesale";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId || !ALL_ACCOUNT_IDS.has(accountId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = createSupabaseService();
    const { data, error } = await sb
      .from("products")
      .select("id, sku, name, size, image_url, drive_link, review_status, review_comments, created_at, can_buy_individually, categories(name)")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const cacheBust = String(Date.now());
    // Only designs added after this date get the "New" badge going forward
    const NEW_BADGE_CUTOFF = new Date("2026-04-30T00:00:00Z").getTime();

    const products: WholesaleProduct[] = (data ?? []).map((row) => {
      const categoriesRaw = row.categories as { name: string }[] | { name: string } | null;
      const category = Array.isArray(categoriesRaw)
        ? (categoriesRaw[0]?.name ?? "")
        : (categoriesRaw?.name ?? "");
      const sku = String(row.sku ?? "");
      const name = String(row.name ?? "");
      const isPackProduct =
        sku.toUpperCase() === "RP_PACK" || sku.toUpperCase() === "HWP_PACK";

      const packType = getPackType(name, category, sku);
      const standalonePackDesign = isStandalonePackDesign(name);
      const packOnly =
        !!packType && !standalonePackDesign && !isPackProduct;

      const imageUrl = productImageUrl(
        row.image_url as string | null,
        row.drive_link as string | null,
        "w400",
        cacheBust
      );

      const dateAdded = row.created_at as string;
      const isNew = new Date(dateAdded).getTime() > NEW_BADGE_CUTOFF;

      return {
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
      };
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[wholesale/products]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
