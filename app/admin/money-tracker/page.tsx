import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { MoneyTrackerView } from "@/components/admin/MoneyTrackerView";

export const dynamic = "force-dynamic";

export default async function MoneyTrackerPage() {
  const sb = await createSupabaseServer();

  const [mfgRes, miscRes, salesRes] = await Promise.all([
    sb.from("mfg_orders")
      .select("id, order_id, order_date, total_cost, status")
      .order("order_date", { ascending: false }),
    sb.from("misc_expenses")
      .select("*")
      .order("date", { ascending: false }),
    sb.from("sales_orders")
      .select("id, created_at, total_amount, status")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminShell title="Money Tracker">
      <MoneyTrackerView
        mfgOrders={mfgRes.data ?? []}
        miscExpenses={miscRes.data ?? []}
        salesOrders={salesRes.data ?? []}
      />
    </AdminShell>
  );
}
