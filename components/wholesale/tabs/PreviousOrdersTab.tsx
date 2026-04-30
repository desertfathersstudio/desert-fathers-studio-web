"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ORDER_STAGES } from "@/types/wholesale";
import type { WholesaleOrder, OrderStage } from "@/types/wholesale";

interface Props {
  accountId: string;
  canEditFulfillment: boolean;
  refreshKey: number;
}

const STAGE_COLOR: Record<OrderStage, { bg: string; text: string }> = {
  Pending:    { bg: "#e8f4ff", text: "#1a56db" },
  Processing: { bg: "#fef9c3", text: "#854d0e" },
  Printed:    { bg: "#dcfce7", text: "#166534" },
  Packed:     { bg: "#f5f3ff", text: "#6d28d9" },
  Shipped:    { bg: "#fff7ed", text: "#9a3412" },
  Delivered:  { bg: "#14532d", text: "#bbf7d0" },
  Cancelled:  { bg: "#fee2e2", text: "#991b1b" },
};

export function PreviousOrdersTab({ accountId, refreshKey }: Props) {
  const [orders, setOrders] = useState<WholesaleOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<OrderStage | "All">("All");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/wholesale/orders?accountId=${encodeURIComponent(accountId)}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const { orders: data } = await res.json();
      setOrders(data);
    } catch (err) {
      setError("Failed to load orders: " + String(err));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { loadOrders(); }, [loadOrders, refreshKey]);

  const filtered = (orders ?? []).filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.orderId.toLowerCase().includes(q) ||
      (o.trackingNumber ?? "").toLowerCase().includes(q);
    const matchStage = stageFilter === "All" || o.orderStage === stageFilter;
    return matchSearch && matchStage;
  });

  if (loading) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.75rem", fontWeight: 500, color: "var(--text)", margin: "0 0 0.25rem", letterSpacing: "-0.01em" }}>
          Your Orders
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
          {orders?.length ?? 0} order{orders?.length !== 1 ? "s" : ""} placed
        </p>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by order ID or tracking…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "0.55rem 1rem", border: "1.5px solid var(--border)", borderRadius: "999px", fontSize: "0.82rem", fontFamily: "var(--font-inter)", color: "var(--text)", outline: "none", background: "white" }}
        />
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {(["All", ...ORDER_STAGES] as (OrderStage | "All")[]).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              style={{
                padding: "0.3rem 0.7rem", borderRadius: "999px", border: "1.5px solid",
                borderColor: stageFilter === s ? "var(--brand)" : "var(--border)",
                background: stageFilter === s ? "var(--brand)" : "white",
                color: stageFilter === s ? "#fff" : "var(--text-muted)",
                fontSize: "0.72rem", fontWeight: stageFilter === s ? 600 : 400,
                cursor: "pointer", fontFamily: "var(--font-inter)", whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-card)", borderRadius: "var(--radius-card)", border: "1.5px dashed var(--border)", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          {orders?.length === 0 ? "No orders placed yet." : "No orders match your filter."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              expanded={expanded.has(order.orderId)}
              accountId={accountId}
              onToggle={() => setExpanded((prev) => {
                const next = new Set(prev);
                next.has(order.orderId) ? next.delete(order.orderId) : next.add(order.orderId);
                return next;
              })}
              onUpdated={(updated) =>
                setOrders((prev) => prev ? prev.map((o) => o.orderId === updated.orderId ? updated : o) : prev)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order, expanded, accountId, onToggle, onUpdated,
}: {
  order: WholesaleOrder;
  expanded: boolean;
  accountId: string;
  onToggle: () => void;
  onUpdated: (o: WholesaleOrder) => void;
}) {
  const [markingPayment, setMarkingPayment] = useState(false);

  const stageColors = STAGE_COLOR[order.orderStage] ?? { bg: "#e0e0e0", text: "#555" };
  const stageIdx = ORDER_STAGES.indexOf(order.orderStage);

  const formattedDate = (() => {
    try {
      return new Date(order.createdAt).toLocaleString(undefined, {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      });
    } catch { return order.createdAt; }
  })();

  async function markPaymentSent() {
    if (order.paymentSent) return;
    setMarkingPayment(true);
    try {
      const res = await fetch(
        `/api/wholesale/orders/${encodeURIComponent(order.orderId)}?accountId=${encodeURIComponent(accountId)}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentSent: true }) }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      onUpdated({ ...order, paymentSent: true, paymentSentDate: new Date().toISOString().slice(0, 10) });
      toast.success("Payment marked as sent — we'll confirm receipt shortly.");
    } catch (e) {
      toast.error("Error: " + String(e));
    } finally {
      setMarkingPayment(false);
    }
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
        borderLeft: `3px solid ${order.asap ? "#e65100" : "var(--brand)"}`,
      }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-inter)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>{order.orderId}</span>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{formattedDate}</span>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            {order.items.reduce((s, i) => s + i.qty, 0)} stickers — ${order.grandTotal.toFixed(2)}
          </span>
          {order.asap && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#e65100", background: "#fff3cd", padding: "1px 7px", borderRadius: "999px" }}>⚡ ASAP</span>}
          <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 10px", borderRadius: "999px", background: stageColors.bg, color: stageColors.text }}>{order.orderStage}</span>
        </div>
        {expanded ? <ChevronUp size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.5rem", borderTop: "1px solid var(--border)" }}>
          {/* Stage tracker */}
          <div style={{ display: "flex", alignItems: "flex-start", margin: "1.25rem 0 1rem", gap: 0 }}>
            {ORDER_STAGES.map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", fontSize: "0.58rem", color: done ? "#166534" : active ? "var(--brand)" : "#ccc", textAlign: "center", gap: "0.3rem", fontWeight: active ? 700 : 400 }}>
                  {i < ORDER_STAGES.length - 1 && (
                    <div style={{ position: "absolute", top: 10, left: "50%", width: "100%", height: 2, background: done ? "#166534" : "#ece6da", zIndex: 0 }} />
                  )}
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid", borderColor: done ? "#166534" : active ? "var(--brand)" : "#ddd", background: done ? "#166534" : active ? "var(--brand)" : "white", color: (done || active) ? "white" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, zIndex: 1, position: "relative" }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span>{s}</span>
                </div>
              );
            })}
          </div>

          {/* Tracking link */}
          {order.trackingNumber && (
            <div style={{ fontSize: "0.82rem", color: "var(--text)", padding: "0.6rem 0.85rem", background: "var(--bg-card)", borderRadius: 8, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📦</span>
              <span>Tracking:</span>
              <a
                href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "underline" }}
              >
                {order.trackingNumber}
              </a>
            </div>
          )}

          {/* Item table */}
          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-card)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Design</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>SKU</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</th>
                  <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {item.imageUrl && <img src={item.imageUrl} alt="" aria-hidden style={{ width: 34, height: 34, objectFit: "contain", background: "var(--bg-card)", borderRadius: 5, flexShrink: 0 }} />}
                      <span>{item.designName}</span>
                    </td>
                    <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "monospace", fontSize: "0.74rem", color: "var(--text-muted)" }}>{item.productId}</td>
                    <td style={{ padding: "7px 8px", textAlign: "center" }}>{item.qty}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "var(--brand)" }}>${item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: "right", margin: "0.6rem 0 0", fontWeight: 700 }}>
              Grand Total: <span style={{ color: "var(--brand)" }}>${order.grandTotal.toFixed(2)}</span>
            </p>
          </div>

          {/* Payment section */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment</span>
            {!order.paymentSent ? (
              <button
                onClick={markPaymentSent}
                disabled={markingPayment}
                style={{ padding: "0.4rem 1rem", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius-btn)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-inter)" }}
              >
                {markingPayment ? "Marking…" : "Mark Payment Sent"}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.74rem", padding: "2px 10px", borderRadius: "999px", fontWeight: 600, background: "#fef9c3", color: "#854d0e" }}>
                  Payment Sent {order.paymentSentDate ? `· ${order.paymentSentDate}` : ""}
                </span>
                {order.paymentReceived ? (
                  <span style={{ fontSize: "0.74rem", padding: "2px 10px", borderRadius: "999px", fontWeight: 600, background: "#dcfce7", color: "#166534" }}>
                    ✓ Received {order.paymentReceivedDate ? `· ${order.paymentReceivedDate}` : ""}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Awaiting confirmation…</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
