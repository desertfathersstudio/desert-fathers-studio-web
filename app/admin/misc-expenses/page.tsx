import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { MiscExpensesView } from "@/components/admin/MiscExpensesView";

export const dynamic = "force-dynamic";

export default async function MiscExpensesPage() {
  const sb = await createSupabaseServer();
  const { data: expenses } = await sb
    .from("misc_expenses")
    .select("*")
    .order("date", { ascending: false });

  return (
    <AdminShell title="Misc. Expenses">
      <MiscExpensesView expenses={expenses ?? []} />
    </AdminShell>
  );
}
