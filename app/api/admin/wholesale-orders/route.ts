import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import type { WholesaleOrder, WholesaleOrderItem, OrderStage } from "@/types/wholesale";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("wholesale_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/admin/wholesale-orders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders: WholesaleOrder[] = (data ?? []).map((row) => ({
    id: String(row.id),
    orderId: String(row.order_id),
    accountId: String(row.account_id),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    items: (row.items as WholesaleOrderItem[]) ?? [],
    grandTotal: Number(row.grand_total),
    asap: Boolean(row.asap),
    orderStage: (row.order_stage as OrderStage) ?? "Pending",
    trackingNumber: row.tracking_number as string | null,
    paymentSent: Boolean(row.payment_sent),
    paymentSentDate: row.payment_sent_date as string | null,
    paymentReceived: Boolean(row.payment_received),
    paymentReceivedDate: row.payment_received_date as string | null,
    createdAt: String(row.created_at),
  }));

  return NextResponse.json({ orders });
}
