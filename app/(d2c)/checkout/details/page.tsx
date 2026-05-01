"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { DetailsForm } from "./DetailsForm";

export default function DetailsPage() {
  const { items } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) router.replace("/checkout");
  }, [items, router]);

  if (items.length === 0) return null;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100svh" }}>
      <header
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <Link
          href="/checkout"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          ← Cart
        </Link>
        <span
          className="font-serif text-lg font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Desert Fathers Studio
        </span>
        <div className="w-16" />
      </header>

      <DetailsForm />
    </div>
  );
}
