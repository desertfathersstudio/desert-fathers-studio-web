import { Nav } from "@/components/d2c/Nav";
import { CatalogSection } from "@/components/d2c/CatalogSection";
import { Footer } from "@/components/d2c/Footer";
import { type CategoryKey } from "@/lib/catalog";

const VALID_CATEGORIES: CategoryKey[] = [
  "packs", "christ", "our-lady", "angels", "saints",
  "prophets", "scenes", "holy-week", "resurrection",
];

export default function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = VALID_CATEGORIES.includes(searchParams.category as CategoryKey)
    ? (searchParams.category as CategoryKey)
    : undefined;

  return (
    <>
      <Nav />
      <main className="pt-16">
        <CatalogSection initialCategory={category} />
      </main>
      <Footer />
    </>
  );
}
