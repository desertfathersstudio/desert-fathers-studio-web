import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryView } from "@/components/admin/InventoryView";
import type { AdminStats, ProductWithInventory } from "@/lib/admin/types";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const sb = await createSupabaseServer();

  const [
    { data: products },
    { data: mfgItemsAgg },
    { data: salesAgg },
  ] = await Promise.all([
    sb
      .from("products")
      .select("*, categories(name), inventory(*)")
      .eq("active", true)
      .order("sku"),
    sb
      .from("mfg_order_items")
      .select("qty_ordered")
      .then((r) => ({
        data: { sum: r.data?.reduce((s, i) => s + (i.qty_ordered ?? 0), 0) ?? 0 },
        error: r.error,
      })),
    sb
      .from("sales_order_items")
      .select("quantity")
      .then((r) => ({
        data: { sum: r.data?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0 },
        error: r.error,
      })),
  ]);

  const list = (products ?? []) as ProductWithInventory[];

  const stats: AdminStats = {
    total:        list.length,
    approved:     list.filter((p) => p.review_status === "approved").length,
    pendingReview:list.filter((p) => p.review_status === "under_review").length,
    lowStock:     list.filter((p) => p.inventory?.status === "low").length,
    soldOut:      list.filter((p) => p.inventory?.status === "sold_out").length,
    needReorder:  list.filter(
      (p) => (p.inventory?.on_hand ?? 0) <= (p.inventory?.low_stock_threshold ?? 10)
    ).length,
    onHandNow:    list.reduce((s, p) => s + (p.inventory?.on_hand ?? 0), 0),
    everOrdered:  (mfgItemsAgg as { sum: number })?.sum ?? 0,
    totalSold:    (salesAgg as { sum: number })?.sum ?? 0,
  };

  return (
    <AdminShell title="Inventory">
      <InventoryView products={list} stats={stats} />
    </AdminShell>
  );
}
