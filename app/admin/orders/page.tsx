import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersView } from "@/components/admin/OrdersView";
import type { MfgOrder, Supplier } from "@/lib/admin/types";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const sb = await createSupabaseServer();

  const { data: orders } = await sb
    .from("mfg_orders")
    .select(`
      *,
      suppliers(id, name),
      mfg_order_items(
        *,
        products(name, sku, image_url)
      )
    `)
    .order("order_date", { ascending: false });

  const { data: suppliers } = await sb
    .from("suppliers")
    .select("id, name, contact_info, notes")
    .order("name");

  const { data: products } = await sb
    .from("products")
    .select("id, sku, name, image_url")
    .eq("active", true)
    .order("sku");

  return (
    <AdminShell title="Orders">
      <OrdersView
        orders={(orders ?? []) as MfgOrder[]}
        suppliers={(suppliers ?? []) as Supplier[]}
        products={products ?? []}
      />
    </AdminShell>
  );
}
