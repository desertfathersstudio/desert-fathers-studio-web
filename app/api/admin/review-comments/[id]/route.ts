import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseService } from "@/lib/supabase/service";

// PATCH: resolve or unresolve a comment
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: { action: "resolve" | "unresolve" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const sbService = createSupabaseService();
    const update =
      body.action === "resolve"
        ? { is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: "Jerome (Admin)" }
        : { is_resolved: false, resolved_at: null, resolved_by: null };

    const { data, error } = await sbService
      .from("product_comments")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/review-comments PATCH]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE: remove a comment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const sbService = createSupabaseService();
    const { error } = await sbService
      .from("product_comments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/review-comments DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
