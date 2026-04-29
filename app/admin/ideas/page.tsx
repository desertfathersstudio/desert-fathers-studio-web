import { createSupabaseServer } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { IdeasView } from "@/components/admin/IdeasView";
import type { DesignIdea } from "@/lib/admin/types";

export const metadata = { title: "Ideas" };

export default async function IdeasPage() {
  const sb = await createSupabaseServer();

  const { data: ideas } = await sb
    .from("design_ideas")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminShell title="Design Ideas">
      <IdeasView ideas={(ideas ?? []) as DesignIdea[]} />
    </AdminShell>
  );
}
