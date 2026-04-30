import { createSupabaseService } from "@/lib/supabase/service";
import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleOrdersAdminView } from "@/components/admin/WholesaleOrdersAdminView";
import type { WholesaleOrder, WholesaleOrderItem, OrderStage } from "@/types/wholesale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wholesale Orders" };

export default async function WholesaleOrdersPage() {
  const sb = createSupabaseService();
  const { data } = await sb
    .from("wholesale_orders")
    .select("*")
    .order("created_at", { ascending: false });

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

  return (
    <AdminShell title="Wholesale Orders">
      <WholesaleOrdersAdminView initialOrders={orders} />
    </AdminShell>
  );
}
