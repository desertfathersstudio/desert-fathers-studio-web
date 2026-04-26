import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desert Fathers Studio",
  description: "Coptic Orthodox icon stickers — sacred art for everyday life.",
};

export default function D2CLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
