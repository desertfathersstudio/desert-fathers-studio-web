"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createSupabaseService } from "@/lib/supabase/service";
import type { ProductWithInventory, ReviewStatus } from "@/lib/admin/types";

function revalidatePublicRoutes() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/packs");
  revalidatePath("/coming-soon");
  revalidatePath("/shop/[slug]", "page");
}

async function sendAvailabilityNotifications(productName: string) {
  const sb = createSupabaseService();

  const { data: requests } = await sb
    .from("notify_requests")
    .select("email")
    .eq("product_name", productName)
    .is("notified_at", null);

  if (!requests?.length) return;

  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@desertfathersstudio.com";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f4ec;font-family:Georgia,serif;">
  <div style="max-width:540px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e8ddd5;">
    <div style="background:#6b1d3b;padding:36px 40px;text-align:center;">
      <p style="color:#c4a35a;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 10px;font-family:system-ui,sans-serif;">Desert Fathers Studio</p>
      <h1 style="color:#efe7d6;font-size:1.55rem;font-weight:400;margin:0;letter-spacing:0.01em;">Good news — it's here.</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2a1a0e;font-size:0.97rem;line-height:1.75;margin:0 0 20px;">
        You asked to be notified when <strong>${productName}</strong> became available. The wait is over — it is now in our shop and ready to ship.
      </p>
      <p style="color:#5a3a2a;font-size:0.88rem;line-height:1.7;margin:0 0 32px;">
        Every design is printed on premium vinyl with a matte laminate finish, crafted to last. We hope it brings you joy wherever it lands.
      </p>
      <div style="text-align:center;margin-bottom:32px;">
        <a href="https://desertfathersstudio.com/shop"
           style="display:inline-block;background:#6b1d3b;color:#efe7d6;text-decoration:none;padding:13px 32px;border-radius:6px;font-size:0.78rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:system-ui,sans-serif;">
          Shop Now
        </a>
      </div>
      <p style="color:#b09090;font-size:0.72rem;line-height:1.6;text-align:center;margin:0;font-family:system-ui,sans-serif;">
        You received this email because you requested a notification on desertfathersstudio.com.<br/>
        No further action is required if you no longer wish to hear from us.
      </p>
    </div>
    <div style="border-top:1px solid #e8ddd5;padding:18px 40px;text-align:center;background:#fdf9f4;">
      <p style="color:#c9b5b5;font-size:0.68rem;margin:0;font-family:system-ui,sans-serif;">
        Desert Fathers Studio &nbsp;·&nbsp;
        <a href="https://desertfathersstudio.com" style="color:#9a7080;text-decoration:none;">desertfathersstudio.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  for (const { email } of requests) {
    await resend.emails.send({
      from,
      to: email,
      subject: `${productName} is now available — Desert Fathers Studio`,
      html,
    });
  }

  await sb
    .from("notify_requests")
    .update({ notified_at: new Date().toISOString() })
    .eq("product_name", productName)
    .is("notified_at", null);
}

export async function adminUpdateProduct(
  productId: string,
  input: {
    name: string;
    categoryId?: string | null;
    reviewStatus: ReviewStatus;
    reviewComments: string | null;
    imageUrl: string | null;
    onHand: number;
    incoming: number;
    threshold: number;
    hasInventory: boolean;
    comingSoon?: boolean;
    featured?: boolean;
  }
): Promise<void> {
  const sb = createSupabaseService();

  // Check previous state to detect transitions that trigger notifications
  const { data: prev } = await sb
    .from("products")
    .select("name, coming_soon, inventory(on_hand)")
    .eq("id", productId)
    .single();

  const ts = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    name: input.name,
    review_status: input.reviewStatus,
    review_comments: input.reviewComments,
    image_url: input.imageUrl,
    updated_at: ts,
  };

  if ("categoryId" in input) {
    updatePayload.category_id = input.categoryId ?? null;
  }

  if (input.imageUrl) {
    updatePayload.image_updated_at = ts;
  }

  if (typeof input.comingSoon === "boolean") {
    updatePayload.coming_soon = input.comingSoon;
  }

  if (typeof input.featured === "boolean") {
    updatePayload.featured = input.featured;
  }

  const { error: pErr } = await sb
    .from("products")
    .update(updatePayload)
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

  // Trigger notifications if coming_soon changed true → false (product made available)
  if (prev?.coming_soon === true && input.comingSoon === false) {
    await sendAvailabilityNotifications(input.name).catch(console.error);
  }

  // Trigger notifications if sold-out stock is being replenished (on_hand 0 → N)
  if (input.onHand > 0 && input.hasInventory && prev) {
    const prevInv = prev.inventory as { on_hand: number }[] | { on_hand: number } | null;
    const prevOnHand = Array.isArray(prevInv) ? prevInv[0]?.on_hand : prevInv?.on_hand;
    if (prevOnHand === 0) {
      await sendAvailabilityNotifications(input.name).catch(console.error);
    }
  }

  revalidatePublicRoutes();
}

export async function adminBatchReplaceImage(
  productId: string,
  imageUrl: string,
  mode: "live" | "review"
): Promise<{ imageUpdatedAt: string }> {
  const sb = createSupabaseService();
  const ts = new Date().toISOString();
  const payload: Record<string, unknown> = {
    image_url: imageUrl,
    image_updated_at: ts,
    updated_at: ts,
  };
  if (mode === "review") {
    payload.review_status = "under_review";
  }
  const { error } = await sb.from("products").update(payload).eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePublicRoutes();
  return { imageUpdatedAt: ts };
}

export async function adminArchiveProduct(productId: string): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("products")
    .update({ active: false })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePublicRoutes();
}

export async function adminAddPack(input: {
  name: string;
  description: string;
  retailPrice: number;
  wholesalePrice: number;
  accentColor: string;
  imageUrl: string | null;
  imageUpdatedAt: string | null;
  constituentProductIds: string[];
  packOnly: boolean;
  newStickers: { name: string; imageUrl: string; imageUpdatedAt: string }[];
}): Promise<ProductWithInventory> {
  const sb = createSupabaseService();
  const ts = new Date().toISOString();

  // Derive next PK-# by inspecting existing sticker_packs SKUs
  const { data: existingPacks } = await sb.from("sticker_packs").select("sku");
  const usedNums = (existingPacks ?? [])
    .map((p) => parseInt(String(p.sku ?? "").replace(/^PK-/i, ""), 10))
    .filter((n) => !isNaN(n));
  const nextNum = usedNums.length > 0 ? Math.max(...usedNums) + 1 : 3;
  const sku = `PK-${nextNum}`;

  // Slug and short_code from name
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const shortCode = input.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);

  const totalSize = input.constituentProductIds.length + input.newStickers.length;

  // 1. Insert sticker_packs row
  const { data: pack, error: spErr } = await sb
    .from("sticker_packs")
    .insert({
      short_code: shortCode,
      name: input.name,
      sku,
      slug,
      description: input.description,
      accent_color: input.accentColor,
      pack_size: totalSize,
      retail_price: input.retailPrice,
      wholesale_price: input.wholesalePrice,
      active: true,
      created_at: ts,
    })
    .select("id")
    .single();
  if (spErr) throw new Error(spErr.message);

  // 2. Insert pack product row (the thing D2C customers actually add to cart)
  const { data: prod, error: pErr } = await sb
    .from("products")
    .insert({
      sku,
      name: input.name,
      category_id: null,
      pack_id: null,
      review_status: "approved" as ReviewStatus,
      retail_price: input.retailPrice,
      image_url: input.imageUrl || null,
      ...(input.imageUrl ? { image_updated_at: input.imageUpdatedAt ?? ts } : {}),
      active: true,
      can_buy_individually: false,
      updated_at: ts,
    })
    .select("*, categories(name)")
    .single();
  if (pErr) throw new Error(pErr.message);

  // 3. Initialize per-product inventory record for the pack row
  const { data: inv, error: iErr } = await sb
    .from("inventory")
    .insert({ product_id: prod.id, on_hand: 0, incoming: 0, low_stock_threshold: 5 })
    .select()
    .single();
  if (iErr) throw new Error(iErr.message);

  // 4. Initialize pack_inventory record
  await sb.from("pack_inventory").insert({
    pack_id: pack.id,
    on_hand: 0,
    incoming: 0,
    low_stock_threshold: 5,
  });

  // 5. Link constituent stickers → this pack
  if (input.constituentProductIds.length > 0) {
    const { error: linkErr } = await sb
      .from("products")
      .update({
        pack_id: pack.id,
        ...(input.packOnly ? { can_buy_individually: false } : {}),
      })
      .in("id", input.constituentProductIds);
    if (linkErr) throw new Error(linkErr.message);
  }

  // 6. Create new sticker products for each uploaded image
  if (input.newStickers.length > 0) {
    // Derive next STK-### offset
    const { data: existingStickers } = await sb.from("products").select("sku").ilike("sku", "STK-%");
    const usedStkNums = (existingStickers ?? [])
      .map((p) => parseInt(String(p.sku ?? "").replace(/^STK-/i, ""), 10))
      .filter((n) => !isNaN(n));
    const maxStkNum = usedStkNums.length > 0 ? Math.max(...usedStkNums) : 0;

    const stickerRows = input.newStickers.map((s, idx) => ({
      sku: `STK-${String(maxStkNum + idx + 1).padStart(3, "0")}`,
      name: s.name,
      category_id: null,
      pack_id: pack.id,
      review_status: "under_review" as ReviewStatus,
      retail_price: 2.0,
      image_url: s.imageUrl,
      image_updated_at: s.imageUpdatedAt,
      active: true,
      can_buy_individually: !input.packOnly,
      updated_at: ts,
    }));

    const { data: newProds, error: spErr2 } = await sb
      .from("products")
      .insert(stickerRows)
      .select("id");
    if (spErr2) throw new Error(spErr2.message);

    // Bulk insert inventory rows for all new stickers
    const invRows = (newProds ?? []).map((p) => ({
      product_id: p.id,
      on_hand: 0,
      incoming: 0,
      low_stock_threshold: 10,
    }));
    if (invRows.length > 0) {
      const { error: invErr } = await sb.from("inventory").insert(invRows);
      if (invErr) throw new Error(invErr.message);
    }
  }

  revalidatePublicRoutes();
  revalidatePath("/admin/inventory");
  return { ...prod, inventory: inv } as ProductWithInventory;
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
      ...(input.imageUrl ? { image_updated_at: new Date().toISOString() } : {}),
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

  revalidatePublicRoutes();
  return { ...prod, inventory: inv } as ProductWithInventory;
}
