import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { SuggestionsView } from "@/components/admin/SuggestionsView";
import type { PublicSuggestion } from "@/lib/admin/types";

export const metadata = { title: "Suggestions" };

export default async function SuggestionsPage() {
  const sb = await createSupabaseServer();

  const { data: suggestions } = await sb
    .from("public_suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: categories } = await sb
    .from("design_ideas")
    .select("category")
    .then((r) => r);

  return (
    <AdminShell title="Suggestions">
      <SuggestionsView suggestions={(suggestions ?? []) as PublicSuggestion[]} />
    </AdminShell>
  );
}
