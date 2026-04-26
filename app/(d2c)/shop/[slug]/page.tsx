import { notFound } from "next/navigation";
import { Nav } from "@/components/d2c/Nav";
import { PackDetail } from "@/components/d2c/PackDetail";
import { Footer } from "@/components/d2c/Footer";

const VALID_SLUGS = ["holy-week-pack", "resurrection-pack"];

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const names: Record<string, string> = {
    "holy-week-pack": "Holy Week Pack",
    "resurrection-pack": "Resurrection Pack",
  };
  const name = names[params.slug];
  if (!name) return {};
  return {
    title: name,
    description: `${name} — Coptic Orthodox icon stickers from Desert Fathers Studio.`,
  };
}

export default function PackPage({ params }: { params: { slug: string } }) {
  if (!VALID_SLUGS.includes(params.slug)) notFound();

  return (
    <>
      <Nav />
      <main className="pt-16">
        <PackDetail slug={params.slug} />
      </main>
      <Footer />
    </>
  );
}
