"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Nav() {
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
      style={{
        background: "rgba(250,247,242,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Logo />
      <nav className="flex items-center gap-6">
        <Link
          href="#catalog"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          Shop
        </Link>
        <Link
          href="/wholesale"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          Sunday Schools
        </Link>
        <Link
          href="#catalog"
          className="text-sm font-semibold px-4 py-2 transition-opacity hover:opacity-80"
          style={{
            background: "var(--brand)",
            color: "#fff",
            borderRadius: "var(--radius-btn)",
          }}
        >
          Browse Catalog
        </Link>
      </nav>
    </header>
  );
}
