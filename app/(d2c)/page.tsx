import { Nav } from "@/components/d2c/Nav";
import { HeroSection } from "@/components/d2c/HeroSection";
import { CatalogSection } from "@/components/d2c/CatalogSection";
import { Footer } from "@/components/d2c/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <CatalogSection />
      </main>
      <Footer />
    </>
  );
}
