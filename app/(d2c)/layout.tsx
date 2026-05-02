import type { Metadata } from "next";
import { CartProvider } from "@/lib/cart";
import { LightboxProvider } from "@/lib/lightbox";
import { CartDrawer } from "@/components/d2c/CartDrawer";
import { StickerLightbox } from "@/components/shared/StickerLightbox";

export const metadata: Metadata = {
  title: "Desert Fathers Studio",
  description: "Coptic Orthodox icon stickers rooted in tradition. Timeless iconography for everyday life.",
};

export default function D2CLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <LightboxProvider>
        {children}
        <CartDrawer />
        <StickerLightbox />
      </LightboxProvider>
    </CartProvider>
  );
}
