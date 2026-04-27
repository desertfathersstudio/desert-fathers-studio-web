import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale Portal",
  description: "Desert Fathers Studio — wholesale ordering for Sunday schools and parishes.",
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
