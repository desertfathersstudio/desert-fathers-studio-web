"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { SESSION_KEY, CART_KEY_PREFIX } from "@/types/wholesale";
import type { WholesaleSession } from "@/types/wholesale";

type Tab = "catalog" | "pending" | "order" | "suggestions" | "orders";

interface Props {
  session: WholesaleSession;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  cartCount: number;
  lastModified: string;
}

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: "catalog",     label: "Catalog" },
  { key: "pending",     label: "Pending" },
  { key: "order",       label: "Order" },
  { key: "suggestions", label: "Suggestions" },
  { key: "orders",      label: "Previous Orders" },
];

export function WholesaleHeader({ session, activeTab, onTabChange, cartCount, lastModified }: Props) {
  const router = useRouter();

  function switchAccount() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(`${CART_KEY_PREFIX}${session.accountId}`);
    } catch {}
    router.replace("/wholesale-portal");
  }

  const tabs = session.hasPendingTab
    ? TAB_LABELS
    : TAB_LABELS.filter((t) => t.key !== "pending");

  const lastModFormatted = lastModified
    ? (() => {
        try {
          return new Date(lastModified).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
        } catch {
          return "";
        }
      })()
    : "";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top bar — maroon */}
      <div
        style={{
          background: "var(--brand)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Logo variant="light" />
            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(239,231,214,0.2)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "0.95rem",
                fontStyle: "italic",
                fontWeight: 400,
                color: "rgba(239,231,214,0.72)",
                letterSpacing: "0.01em",
              }}
            >
              {session.displayName}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            {lastModFormatted && (
              <span
                className="ws-last-mod"
                style={{
                  display: "none",
                  fontSize: "0.64rem",
                  color: "rgba(239,231,214,0.38)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Updated {lastModFormatted}
              </span>
            )}
            <button
              onClick={switchAccount}
              style={{
                fontSize: "0.7rem",
                color: "rgba(239,231,214,0.72)",
                background: "transparent",
                border: "1px solid rgba(239,231,214,0.22)",
                borderRadius: "var(--radius-btn)",
                padding: "0.3rem 0.75rem",
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                transition: "border-color 150ms ease-out, color 150ms ease-out",
              }}
            >
              Switch account
            </button>
          </div>
        </div>
      </div>

      {/* Tab strip — cream */}
      <div
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {tabs.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                aria-current={active ? "page" : undefined}
                data-tab={key}
                data-active={active ? "true" : undefined}
                style={{
                  padding: "0.7rem 1.1rem",
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--brand)" : "var(--text-muted)",
                  background: "none",
                  border: "none",
                  borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  position: "relative",
                  transition: "color 150ms ease-out",
                }}
              >
                {label}
                {key === "order" && cartCount > 0 && (
                  <span
                    style={{
                      marginLeft: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--gold)",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      minWidth: "1rem",
                      height: "1rem",
                      padding: "0 3px",
                      verticalAlign: "middle",
                      position: "relative",
                      top: "-1px",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .ws-last-mod { display: block !important; }
        }
      `}</style>
    </header>
  );
}
