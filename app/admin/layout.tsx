import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "DFS Admin", template: "%s — DFS Admin" },
  description: "Desert Fathers Studio internal dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DFS Admin",
  },
};

export const viewport: Viewport = {
  themeColor: "#6b1d3b",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.update())); navigator.serviceWorker.register('/sw.js'); }`,
        }}
      />
    </>
  );
}
