"use client";

import Link from "next/link";
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
        background: "rgba(248,244,236,0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Top row */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Logo />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--brand)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Wholesale
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              {session.displayName}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          {lastModFormatted && (
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                display: "none",
              }}
              className="ws-last-mod"
            >
              Updated {lastModFormatted}
            </span>
          )}
          <button
            onClick={switchAccount}
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-btn)",
              padding: "0.35rem 0.75rem",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              whiteSpace: "nowrap",
            }}
          >
            Switch account
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 1.25rem",
          display: "flex",
          gap: "0",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            aria-current={activeTab === key ? "page" : undefined}
            style={{
              padding: "0.65rem 1rem",
              fontSize: "0.82rem",
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? "var(--brand)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: activeTab === key
                ? "2px solid var(--brand)"
                : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
              position: "relative",
            }}
          >
            {label}
            {key === "order" && cartCount > 0 && (
              <span
                style={{
                  marginLeft: 5,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--brand)",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  minWidth: "1rem",
                  height: "1rem",
                  padding: "0 3px",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .ws-last-mod { display: block !important; }
        }
      `}</style>
    </header>
  );
}
