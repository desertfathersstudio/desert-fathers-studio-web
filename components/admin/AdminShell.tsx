"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Gift,
  Lightbulb,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Toaster } from "sonner";
import { PasskeySetup } from "./PasskeySetup";

const NAV = [
  { href: "/admin/inventory",     label: "Inventory",    icon: Package },
  { href: "/admin/orders",        label: "Orders",       icon: ShoppingCart },
  { href: "/admin/giveaways",     label: "Giveaways",    icon: Gift },
  { href: "/admin/ideas",         label: "Ideas",        icon: Lightbulb },
  { href: "/admin/money-tracker", label: "Money",        icon: TrendingUp },
  { href: "/admin/misc-expenses", label: "Expenses",     icon: Receipt },
  { href: "/admin/wholesale",     label: "Wholesale",    icon: Users },
  { href: "/admin/suggestions",   label: "Suggestions",  icon: MessageSquare },
];

const BOTTOM_TABS = NAV.slice(0, 4); // Inventory, Orders, Giveaways, Ideas on bottom bar

// ── Color tokens ──────────────────────────────────────────────────────
const C = {
  sidebarBg:     "#0d0609",
  sidebarBorder: "#1e0f16",
  topbarBg:      "#1a0d12",
  activeBg:      "#6b1d3b",
  activeText:    "#fff",
  inactiveText:  "#9a7080",
  hoverBg:       "rgba(107,29,59,0.18)",
  contentBg:     "#f5f0ea",
  brand:         "#6b1d3b",
};

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);

  useEffect(() => {
    // Prompt to set up passkey if user has none and hasn't dismissed
    const dismissed = sessionStorage.getItem("dfs-passkey-dismissed");
    if (dismissed) return;
    if (typeof window === "undefined" || !window.PublicKeyCredential) return;

    const sb = createSupabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      sb.from("admin_passkeys")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("device_name", "eq", "__challenge__")
        .not("device_name", "eq", "__auth_challenge__")
        .then(({ count }) => {
          if ((count ?? 0) === 0) setShowPasskeySetup(true);
        });
    });
  }, []);

  async function handleLogout() {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut();
    router.push("/admin/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Toaster position="top-right" richColors />

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex"
        style={{
          width: 220,
          flexShrink: 0,
          flexDirection: "column",
          background: C.sidebarBg,
          borderRight: `1px solid ${C.sidebarBorder}`,
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          zIndex: 40,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "1.25rem 1rem 1rem",
            borderBottom: `1px solid ${C.sidebarBorder}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.brand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
            >
              DFS
            </div>
            <div>
              <div style={{ color: "#f5f0ea", fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2 }}>
                DFS Admin
              </div>
              <div style={{ color: C.inactiveText, fontSize: "0.68rem", lineHeight: 1.2 }}>
                Desert Fathers Studio
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.55rem 0.75rem",
                  borderRadius: 8,
                  marginBottom: 2,
                  color: active ? C.activeText : C.inactiveText,
                  background: active ? C.activeBg : "transparent",
                  fontWeight: active ? 600 : 400,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = C.hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "0.75rem 0.5rem", borderTop: `1px solid ${C.sidebarBorder}` }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              width: "100%",
              padding: "0.55rem 0.75rem",
              borderRadius: 8,
              color: C.inactiveText,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontFamily: "inherit",
              transition: "color 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.inactiveText;
            }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: 0,
          minWidth: 0,
        }}
        className="md:ml-[220px]"
      >
        {/* Top bar */}
        <header
          style={{
            height: 52,
            background: C.topbarBg,
            borderBottom: `1px solid ${C.sidebarBorder}`,
            display: "flex",
            alignItems: "center",
            padding: "0 1rem",
            position: "sticky",
            top: 0,
            zIndex: 30,
            gap: "0.75rem",
          }}
        >
          {/* Mobile brand */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: C.brand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              DFS
            </div>
          </div>

          <h1
            style={{
              flex: 1,
              color: "#f5f0ea",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>

          {/* Mobile menu button */}
          <button
            className="flex md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: C.inactiveText,
              cursor: "pointer",
              padding: 4,
            }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            background: C.contentBg,
            paddingBottom: 80, // space for mobile bottom tabs
          }}
          className="md:pb-0"
        >
          {children}
        </main>
      </div>

      {/* ── Mobile: slide-in full menu ───────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 240,
              background: C.sidebarBg,
              borderLeft: `1px solid ${C.sidebarBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderBottom: `1px solid ${C.sidebarBorder}`,
              }}
            >
              <span style={{ color: "#f5f0ea", fontWeight: 700, fontSize: "0.9rem" }}>
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "none", border: "none", color: C.inactiveText, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
            <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.65rem 0.75rem",
                      borderRadius: 8,
                      marginBottom: 2,
                      color: active ? C.activeText : C.inactiveText,
                      background: active ? C.activeBg : "transparent",
                      fontWeight: active ? 600 : 400,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div style={{ padding: "0.75rem 0.5rem", borderTop: `1px solid ${C.sidebarBorder}` }}>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: 8,
                  color: "#f87171",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              >
                <LogOut size={17} strokeWidth={1.8} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Passkey setup prompt ─────────────────────────────────────── */}
      {showPasskeySetup && (
        <PasskeySetup
          onDismiss={() => {
            sessionStorage.setItem("dfs-passkey-dismissed", "1");
            setShowPasskeySetup(false);
          }}
        />
      )}

      {/* ── Mobile bottom tab bar ────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 flex md:hidden"
        style={{
          background: C.sidebarBg,
          borderTop: `1px solid ${C.sidebarBorder}`,
          zIndex: 40,
          height: 64,
          alignItems: "stretch",
        }}
      >
        {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? "#d4849c" : C.inactiveText,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: "0.62rem", fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </Link>
          );
        })}
        {/* More → opens slide menu */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            background: "none",
            border: "none",
            color: C.inactiveText,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Menu size={20} strokeWidth={1.8} />
          <span style={{ fontSize: "0.62rem" }}>More</span>
        </button>
      </nav>
    </div>
  );
}
