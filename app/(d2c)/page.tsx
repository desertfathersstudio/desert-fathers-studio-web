import { Nav } from "@/components/d2c/Nav";
import { HeroSection } from "@/components/d2c/HeroSection";
import { FeaturedProducts } from "@/components/d2c/FeaturedProducts";
import { BrandStory } from "@/components/d2c/BrandStory";
import { Footer } from "@/components/d2c/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <BrandStory />
      </main>
      <Footer />
    </>
  );
}
