import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Wholesale Portal",
  description: "Desert Fathers Studio — wholesale ordering for Sunday schools and parishes.",
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" duration={2500} />
    </>
  );
}
