import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleView } from "@/components/admin/WholesaleView";
import type { WholesaleAccount, PricingTier } from "@/lib/admin/types";

export const metadata = { title: "Wholesale" };

export default async function WholesalePage() {
  const sb = await createSupabaseServer();

  const [{ data: accounts }, { data: tiers }] = await Promise.all([
    sb
      .from("wholesale_accounts")
      .select("*, pricing_tiers(name)")
      .order("business_name"),
    sb
      .from("pricing_tiers")
      .select("id, name")
      .order("name"),
  ]);

  return (
    <AdminShell title="Wholesale">
      <WholesaleView
        accounts={(accounts ?? []) as WholesaleAccount[]}
        tiers={(tiers ?? []) as PricingTier[]}
      />
    </AdminShell>
  );
}
