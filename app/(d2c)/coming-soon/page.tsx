import Image from "next/image";
import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";
import { NotifyMeButton } from "@/components/d2c/NotifyMeButton";
import { createSupabaseServer } from "@/lib/supabase/server";

interface ComingSoonProduct {
  id: string;
  name: string;
  image_url: string | null;
}

async function getComingSoonProducts(): Promise<ComingSoonProduct[]> {
  try {
    const sb = await createSupabaseServer();
    const { data } = await sb
      .from("products")
      .select("id, name, image_url, sku")
      .eq("coming_soon", true)
      .eq("active", true)
      .eq("review_status", "approved")
      .order("sku", { ascending: true });
    return (data ?? []) as ComingSoonProduct[];
  } catch {
    return [];
  }
}

export default async function ComingSoonPage() {
  const products = await getComingSoonProducts();

  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        {/* Page header */}
        <div
          className="pt-28 pb-12 px-6 md:px-10"
          style={{
            background: "var(--cream)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <p
              className="text-[11px] uppercase tracking-[0.28em] font-medium mb-3"
              style={{ color: "var(--gold)" }}
            >
              Desert Fathers Studio
            </p>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                marginBottom: "0.75rem",
              }}
            >
              Coming Soon
            </h1>
            <p
              className="max-w-lg text-sm leading-relaxed"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            >
              These designs are in production. Sign up below to be notified
              the moment each one becomes available.
            </p>
          </div>
        </div>

        {/* Product grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.2rem",
                  color: "var(--text-muted)",
                }}
              >
                No upcoming designs at the moment.
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
              >
                Check back soon — new designs are always in the works.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {products.map((product) => (
                <ComingSoonCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ComingSoonCard({ product }: { product: ComingSoonProduct }) {
  return (
    <article className="flex flex-col">
      {/* Card frame */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-card)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Image */}
        <div
          className="relative aspect-square"
          style={{ background: "#ffffff" }}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-5"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-sans)" }}
            >
              Preview coming
            </div>
          )}

          {/* Coming Soon badge */}
          <span
            className="absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5"
            style={{
              background: "var(--brand)",
              color: "#efe7d6",
              borderRadius: 3,
              opacity: 0.9,
            }}
          >
            Coming Soon
          </span>
        </div>
      </div>

      {/* Text below */}
      <div className="pt-3 pb-1">
        <h3
          className="leading-snug mb-2"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "0.95rem",
            color: "var(--text)",
          }}
        >
          {product.name}
        </h3>
        <NotifyMeButton productName={product.name} variant="full" />
      </div>
    </article>
  );
}
