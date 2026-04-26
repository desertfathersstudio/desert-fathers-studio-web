import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Desert Fathers Studio — internal admin dashboard.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
