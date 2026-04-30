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
