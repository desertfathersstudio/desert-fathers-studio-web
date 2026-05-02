import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://desertfathersstudio.com"),
  title: { default: "Desert Fathers Studio", template: "%s | Desert Fathers Studio" },
  description: "Coptic Orthodox icon stickers rooted in tradition. Timeless iconography reimagined for daily life.",
  openGraph: {
    type:        "website",
    siteName:    "Desert Fathers Studio",
    title:       "Desert Fathers Studio",
    description: "Coptic Orthodox icon stickers rooted in tradition. Timeless iconography reimagined for daily life.",
    url:         "https://desertfathersstudio.com",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Desert Fathers Studio" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Desert Fathers Studio",
    description: "Coptic Orthodox icon stickers rooted in tradition. Timeless iconography reimagined for daily life.",
    images:      ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
