"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/catalog";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);

  const close = () => {
    setOpen(false);
    setStickersOpen(false);
  };

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
        style={{
          background: "rgba(250,247,242,0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Logo />

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
          style={{ cursor: "pointer", background: "none", border: "none" }}
        >
          <span
            className="block h-px w-5 transition-all duration-200 origin-center"
            style={{
              background: "var(--text)",
              transform: open ? "translateY(6px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block h-px w-5 transition-all duration-200"
            style={{
              background: "var(--text)",
              opacity: open ? 0 : 1,
            }}
          />
          <span
            className="block h-px w-5 transition-all duration-200 origin-center"
            style={{
              background: "var(--text)",
              transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.18)" }}
          onClick={close}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-72 flex flex-col pt-20 pb-10 px-8 overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Stickers accordion */}
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setStickersOpen((v) => !v)}
            className="flex items-center justify-between w-full py-4 text-sm font-medium text-left"
            style={{ color: "var(--text)", background: "none", border: "none", cursor: "pointer" }}
          >
            Stickers
            <span
              className="transition-transform duration-200"
              style={{
                display: "inline-block",
                transform: stickersOpen ? "rotate(180deg)" : "none",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
              }}
            >
              ▾
            </span>
          </button>

          {stickersOpen && (
            <div className="pb-3 flex flex-col gap-0.5">
              <Link
                href="/shop"
                onClick={close}
                className="py-2 pl-4 text-sm transition-opacity hover:opacity-60"
                style={{ color: "var(--text-muted)" }}
              >
                All designs
              </Link>
              {CATEGORY_ORDER.map((key) => (
                <Link
                  key={key}
                  href={`/shop?category=${key}`}
                  onClick={close}
                  className="py-2 pl-4 text-sm transition-opacity hover:opacity-60"
                  style={{ color: "var(--text-muted)" }}
                >
                  {CATEGORY_LABELS[key]}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sunday Schools */}
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <Link
            href="/wholesale"
            onClick={close}
            className="flex items-center w-full py-4 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: "var(--text)" }}
          >
            Sunday Schools
          </Link>
        </div>
      </div>
    </>
  );
}
