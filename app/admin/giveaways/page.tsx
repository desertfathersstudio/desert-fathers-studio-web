import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { GiveawaysView } from "@/components/admin/GiveawaysView";
import type { GiftsLog } from "@/lib/admin/types";

export const metadata = { title: "Giveaways" };

export default async function GiveawaysPage() {
  const sb = await createSupabaseServer();

  const { data: giveaways } = await sb
    .from("gifts_log")
    .select("*, products(name, sku)")
    .order("date", { ascending: false });

  const { data: products } = await sb
    .from("products")
    .select("id, sku, name, image_url")
    .eq("active", true)
    .order("sku");

  return (
    <AdminShell title="Giveaways">
      <GiveawaysView
        giveaways={(giveaways ?? []) as GiftsLog[]}
        products={products ?? []}
      />
    </AdminShell>
  );
}
