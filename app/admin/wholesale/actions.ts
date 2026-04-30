"use server";

import { createSupabaseService } from "@/lib/supabase/service";
import type { OrderStage } from "@/types/wholesale";

export async function adminUpdateOrderStage(orderId: string, stage: OrderStage) {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_orders")
    .update({ order_stage: stage })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminUpdateTracking(orderId: string, trackingNumber: string | null) {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_orders")
    .update({ tracking_number: trackingNumber })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminConfirmPaymentReceived(orderId: string, received: boolean) {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_orders")
    .update({
      payment_received: received,
      payment_received_date: received ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminCancelWholesaleOrder(orderId: string) {
  const sb = createSupabaseService();

  // Fetch items to restore inventory
  const { data, error: fetchErr } = await sb
    .from("wholesale_orders")
    .select("items, order_stage")
    .eq("order_id", orderId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  if (data.order_stage === "Cancelled") throw new Error("Order is already cancelled");

  // Restore inventory
  const { error: rpcErr } = await sb.rpc("wholesale_adjust_inventory", {
    p_items: data.items,
    p_delta: 1,
  });
  if (rpcErr) console.error("[adminCancelWholesaleOrder] inventory restore failed:", rpcErr);

  // Mark as cancelled
  const { error } = await sb
    .from("wholesale_orders")
    .update({ order_stage: "Cancelled" })
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}

export async function adminDeleteWholesaleOrder(orderId: string) {
  const sb = createSupabaseService();

  // Fetch items to restore inventory (unless already cancelled — inventory already restored)
  const { data, error: fetchErr } = await sb
    .from("wholesale_orders")
    .select("items, order_stage")
    .eq("order_id", orderId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  if (data.order_stage !== "Cancelled") {
    const { error: rpcErr } = await sb.rpc("wholesale_adjust_inventory", {
      p_items: data.items,
      p_delta: 1,
    });
    if (rpcErr) console.error("[adminDeleteWholesaleOrder] inventory restore failed:", rpcErr);
  }

  // Hard delete
  const { error } = await sb
    .from("wholesale_orders")
    .delete()
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
}
