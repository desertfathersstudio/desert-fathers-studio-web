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
