"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { ORDER_STAGES } from "@/types/wholesale";
import type { WholesaleOrder, OrderStage } from "@/types/wholesale";

interface Props {
  accountId: string;
  canEditFulfillment: boolean;
  refreshKey: number;
}

const STAGE_COLOR: Record<OrderStage, { bg: string; text: string }> = {
  Pending:    { bg: "#e3f2fd", text: "#1565c0" },
  Processing: { bg: "#fff3cd", text: "#856404" },
  Printed:    { bg: "#e8f5e9", text: "#2e7d32" },
  Packed:     { bg: "#f3e5f5", text: "#7b1fa2" },
  Shipped:    { bg: "#fff8e1", text: "#e65100" },
  Delivered:  { bg: "#155724", text: "#fff" },
};

export function PreviousOrdersTab({ accountId, canEditFulfillment, refreshKey }: Props) {
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

  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshKey]);

  const filtered = (orders ?? []).filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderId.toLowerCase().includes(q) ||
      (o.trackingNumber ?? "").toLowerCase().includes(q);
    const matchStage = stageFilter === "All" || o.orderStage === stageFilter;
    return matchSearch && matchStage;
  });

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
        Loading orders…
      </div>
    );
  }
  if (error) {
    return <div style={{ padding: "2rem", color: "#dc2626", fontSize: "0.85rem" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
      <h2
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.4rem",
          fontWeight: 600,
          color: "var(--brand)",
          margin: "0 0 0.25rem",
        }}
      >
        Previous Orders
      </h2>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 1.25rem" }}>
        Newest first.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by order ID or tracking…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "0.5rem 1rem",
            border: "1.5px solid var(--border)",
            borderRadius: "999px",
            fontSize: "0.82rem",
            fontFamily: "var(--font-inter)",
            color: "var(--text)",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {(["All", ...ORDER_STAGES] as (OrderStage | "All")[]).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              style={{
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
                border: "1.5px solid",
                borderColor: stageFilter === s ? "var(--brand)" : "var(--border)",
                background: stageFilter === s ? "var(--brand)" : "white",
                color: stageFilter === s ? "#fff" : "var(--text)",
                fontSize: "0.72rem",
                fontWeight: stageFilter === s ? 600 : 400,
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-card)",
            border: "1.5px dashed var(--border)",
            color: "var(--text-muted)",
            fontSize: "0.88rem",
          }}
        >
          No orders yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {filtered.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              expanded={expanded.has(order.orderId)}
              onToggle={() => {
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(order.orderId)) next.delete(order.orderId);
                  else next.add(order.orderId);
                  return next;
                });
              }}
              accountId={accountId}
              canEditFulfillment={canEditFulfillment}
              onUpdated={(updated) => {
                setOrders((prev) =>
                  prev ? prev.map((o) => o.orderId === updated.orderId ? updated : o) : prev
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  accountId,
  canEditFulfillment,
  onUpdated,
}: {
  order: WholesaleOrder;
  expanded: boolean;
  onToggle: () => void;
  accountId: string;
  canEditFulfillment: boolean;
  onUpdated: (o: WholesaleOrder) => void;
}) {
  const [stageSel, setStageSel] = useState<OrderStage>(order.orderStage);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [savingStage, setSavingStage] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const stageColors = STAGE_COLOR[order.orderStage] ?? { bg: "#e0e0e0", text: "#555" };

  const formattedDate = (() => {
    try {
      return new Date(order.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return order.createdAt;
    }
  })();

  async function patchOrder(body: Record<string, unknown>) {
    const res = await fetch(
      `/api/wholesale/orders/${encodeURIComponent(order.orderId)}?accountId=${encodeURIComponent(accountId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function saveStage() {
    setSavingStage(true);
    try {
      await patchOrder({ orderStage: stageSel });
      onUpdated({ ...order, orderStage: stageSel });
      toast.success("Stage updated");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setSavingStage(false);
    }
  }

  async function saveTracking() {
    setSavingTracking(true);
    try {
      await patchOrder({ trackingNumber: tracking || null });
      onUpdated({ ...order, trackingNumber: tracking || null });
      toast.success("Tracking number saved");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setSavingTracking(false);
    }
  }

  async function togglePayment() {
    setSavingPayment(true);
    const newVal = !order.paymentSent;
    try {
      await patchOrder({ paymentSent: newVal, paymentSentDate: newVal ? new Date().toISOString().slice(0, 10) : null });
      onUpdated({ ...order, paymentSent: newVal, paymentSentDate: newVal ? new Date().toISOString().slice(0, 10) : null });
      toast.success(newVal ? "Marked as payment sent" : "Marked as not sent");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setSavingPayment(false);
    }
  }

  const stageIdx = ORDER_STAGES.indexOf(order.orderStage);

  return (
    <div
      style={{
        background: "white",
        borderRadius: "var(--radius-card)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        borderLeft: `4px solid ${order.asap ? "#e65100" : "var(--brand)"}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "1rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-inter)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>{order.orderId}</span>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{formattedDate}</span>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""} — ${order.grandTotal.toFixed(2)}
          </span>
          {order.asap && (
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#e65100", background: "#fff3cd", padding: "1px 7px", borderRadius: "999px" }}>⚡ ASAP</span>
          )}
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
              background: stageColors.bg,
              color: stageColors.text,
            }}
          >
            {order.orderStage}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          {/* Stage tracker */}
          <div style={{ display: "flex", alignItems: "center", margin: "1rem 0 0.75rem", gap: 0 }}>
            {ORDER_STAGES.map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <div
                  key={s}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", fontSize: "0.6rem", color: done ? "#2e7d32" : active ? "var(--brand)" : "#aaa", textAlign: "center", gap: "0.3rem", fontWeight: active ? 700 : 400 }}
                >
                  {i < ORDER_STAGES.length - 1 && (
                    <div style={{ position: "absolute", top: 10, left: "50%", width: "100%", height: 2, background: done ? "#2e7d32" : "#e0e0e0", zIndex: 0 }} />
                  )}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "2px solid",
                      borderColor: done ? "#2e7d32" : active ? "var(--brand)" : "#ddd",
                      background: done ? "#2e7d32" : active ? "var(--brand)" : "white",
                      color: (done || active) ? "white" : "#aaa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      zIndex: 1,
                      position: "relative",
                      boxShadow: active ? "0 0 0 3px rgba(107,29,59,0.15)" : undefined,
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span style={{ lineHeight: 1.2 }}>{s}</span>
                </div>
              );
            })}
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div style={{ fontSize: "0.78rem", color: "var(--text)", padding: "0.4rem 0.5rem", background: "#f5f0ea", borderRadius: 6, marginBottom: "0.75rem" }}>
              📦 Tracking: <strong>{order.trackingNumber}</strong>
            </div>
          )}

          {/* Item table */}
          <div style={{ overflowX: "auto", marginBottom: "0.75rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "5px 8px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Design</th>
                  <th style={{ padding: "5px 8px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: "5px 8px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: "5px 8px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Unit</th>
                  <th style={{ padding: "5px 8px", textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "5px 8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" aria-hidden style={{ width: 36, height: 36, objectFit: "contain", background: "#f5f0e8", borderRadius: 5, flexShrink: 0 }} />
                      )}
                      <span>{item.designName}</span>
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", fontSize: "0.74rem", color: "var(--text-muted)" }}>{item.productId}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center" }}>{item.qty}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center" }}>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "var(--brand)" }}>${item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: "right", fontWeight: 700, margin: "0.5rem 0 0", fontSize: "0.95rem" }}>
              Grand Total: <span style={{ color: "var(--brand)" }}>${order.grandTotal.toFixed(2)}</span>
            </p>
          </div>

          {/* Admin controls */}
          {canEditFulfillment && (
            <div
              style={{
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Stage */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <label style={adminLabel}>Stage:</label>
                <select
                  value={stageSel}
                  onChange={(e) => setStageSel(e.target.value as OrderStage)}
                  style={adminInput}
                >
                  {ORDER_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={saveStage} disabled={savingStage} style={saveBtn}>
                  {savingStage ? "Saving…" : <><Save size={12} /> Save</>}
                </button>
              </div>

              {/* Tracking */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <label style={adminLabel}>Tracking:</label>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Enter tracking number…"
                  style={{ ...adminInput, flex: 1, minWidth: 160 }}
                />
                <button onClick={saveTracking} disabled={savingTracking} style={saveBtn}>
                  {savingTracking ? "Saving…" : <><Save size={12} /> Save</>}
                </button>
              </div>

              {/* Payment */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <label style={adminLabel}>Payment:</label>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: order.paymentSent ? "#d4edda" : "#f8d7da",
                    color: order.paymentSent ? "#155724" : "#721c24",
                  }}
                >
                  {order.paymentSent ? "Sent" : "Not Sent"}
                </span>
                {order.paymentSentDate && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{order.paymentSentDate}</span>
                )}
                <button onClick={togglePayment} disabled={savingPayment} style={{ ...saveBtn, background: "white", color: "var(--brand)", border: "1px solid var(--brand)" }}>
                  {savingPayment ? "Saving…" : order.paymentSent ? "Undo" : "Mark Sent"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const adminLabel: React.CSSProperties = {
  fontSize: "0.74rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  minWidth: 68,
  flexShrink: 0,
};

const adminInput: React.CSSProperties = {
  padding: "0.35rem 0.6rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.8rem",
  fontFamily: "var(--font-inter)",
  color: "var(--text)",
  background: "white",
  outline: "none",
};

const saveBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "0.35rem 0.7rem",
  background: "var(--brand)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.74rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-inter)",
  flexShrink: 0,
};
