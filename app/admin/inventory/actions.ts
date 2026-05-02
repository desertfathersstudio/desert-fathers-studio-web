"use server";

import { createSupabaseService } from "@/lib/supabase/service";
import type { ProductWithInventory, ReviewStatus } from "@/lib/admin/types";

export async function adminUpdateProduct(
  productId: string,
  input: {
    name: string;
    reviewStatus: ReviewStatus;
    reviewComments: string | null;
    imageUrl: string | null;
    onHand: number;
    incoming: number;
    threshold: number;
    hasInventory: boolean;
  }
): Promise<void> {
  const sb = createSupabaseService();

  const { error: pErr } = await sb
    .from("products")
    .update({
      name: input.name,
      review_status: input.reviewStatus,
      review_comments: input.reviewComments,
      image_url: input.imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (pErr) throw new Error(pErr.message);

  if (input.hasInventory) {
    const { error: iErr } = await sb
      .from("inventory")
      .update({
        on_hand: input.onHand,
        incoming: input.incoming,
        low_stock_threshold: input.threshold,
        last_updated: new Date().toISOString(),
      })
      .eq("product_id", productId);
    if (iErr) throw new Error(iErr.message);
  } else {
    const { error: iErr } = await sb
      .from("inventory")
      .insert({
        product_id: productId,
        on_hand: input.onHand,
        incoming: input.incoming,
        low_stock_threshold: input.threshold,
      });
    if (iErr) throw new Error(iErr.message);
  }
}

export async function adminArchiveProduct(productId: string): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("products")
    .update({ active: false })
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function adminAddProduct(input: {
  sku: string;
  name: string;
  categoryId: string | null;
  reviewStatus: ReviewStatus;
  retailPrice: number;
  imageUrl: string | null;
  onHand: number;
  incoming: number;
  threshold: number;
}): Promise<ProductWithInventory> {
  const sb = createSupabaseService();

  const { data: prod, error: pErr } = await sb
    .from("products")
    .insert({
      sku: input.sku.trim().toUpperCase(),
      name: input.name.trim(),
      category_id: input.categoryId || null,
      review_status: input.reviewStatus,
      retail_price: input.retailPrice,
      image_url: input.imageUrl || null,
      active: true,
      can_buy_individually: true,
    })
    .select("*, categories(name)")
    .single();
  if (pErr) throw new Error(pErr.message);

  const { data: inv, error: iErr } = await sb
    .from("inventory")
    .insert({
      product_id: prod.id,
      on_hand: input.onHand,
      incoming: input.incoming,
      low_stock_threshold: input.threshold,
    })
    .select()
    .single();
  if (iErr) throw new Error(iErr.message);

  return { ...prod, inventory: inv } as ProductWithInventory;
}
