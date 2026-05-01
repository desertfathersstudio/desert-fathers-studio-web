import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseService } from "@/lib/supabase/service";

// GET: list all products that have comments, with their full comment threads
export async function GET() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sbService = createSupabaseService();

    // Products that have at least one comment
    const { data: commentRows, error: cErr } = await sbService
      .from("product_comments")
      .select("product_id")
      .then((r) => ({
        data: [...new Set((r.data ?? []).map((c) => c.product_id as string))],
        error: r.error,
      }));

    if (cErr) throw cErr;
    if (!commentRows || commentRows.length === 0) {
      return NextResponse.json([]);
    }

    const [{ data: products }, { data: comments }] = await Promise.all([
      sbService
        .from("products")
        .select("id, sku, name, image_url, drive_link, categories(name)")
        .in("id", commentRows),
      sbService
        .from("product_comments")
        .select("*")
        .in("product_id", commentRows)
        .order("created_at", { ascending: true }),
    ]);

    const commentsByProduct: Record<string, object[]> = {};
    for (const c of comments ?? []) {
      const pid = (c as { product_id: string }).product_id;
      if (!commentsByProduct[pid]) commentsByProduct[pid] = [];
      commentsByProduct[pid].push(c);
    }

    const result = (products ?? []).map((p) => {
      const categoriesRaw = p.categories as { name: string }[] | { name: string } | null;
      const category = Array.isArray(categoriesRaw)
        ? (categoriesRaw[0]?.name ?? "")
        : (categoriesRaw?.name ?? "");
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        imageUrl: (p.image_url ?? p.drive_link ?? null) as string | null,
        category,
        comments: commentsByProduct[p.id as string] ?? [],
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/review-comments GET]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST: admin adds a reply to a product's comment thread
export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { productId: string; body: string; parentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.productId || !body.body?.trim()) {
    return NextResponse.json({ error: "productId and body required" }, { status: 400 });
  }

  try {
    const sbService = createSupabaseService();
    const { data, error } = await sbService
      .from("product_comments")
      .insert({
        product_id: body.productId,
        body: body.body.trim(),
        author: "Jerome (Admin)",
        author_type: "admin",
        parent_id: body.parentId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/review-comments POST]", err);
    return NextResponse.json({ error: "Failed to save reply" }, { status: 500 });
  }
}
