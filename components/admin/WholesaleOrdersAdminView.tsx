"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Save, Check, Trash2, XCircle } from "lucide-react";
import { ORDER_STAGES, ORDER_STAGES_WITH_CANCEL } from "@/types/wholesale";
import type { WholesaleOrder, OrderStage } from "@/types/wholesale";
import {
  adminUpdateOrderStage,
  adminUpdateTracking,
  adminConfirmPaymentReceived,
  adminCancelWholesaleOrder,
  adminDeleteWholesaleOrder,
} from "@/app/admin/wholesale/actions";

const STAGE_COLOR: Record<OrderStage, { bg: string; text: string }> = {
  Pending:    { bg: "#e3f2fd", text: "#1565c0" },
  Processing: { bg: "#fff3cd", text: "#856404" },
  Printed:    { bg: "#e8f5e9", text: "#2e7d32" },
  Packed:     { bg: "#f3e5f5", text: "#7b1fa2" },
  Shipped:    { bg: "#fff8e1", text: "#e65100" },
  Delivered:  { bg: "#155724", text: "#fff" },
  Cancelled:  { bg: "#fee2e2", text: "#991b1b" },
};

export function WholesaleOrdersAdminView() {
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<OrderStage | "All">("All");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    fetch("/api/admin/wholesale-orders")
      .then((r) => r.json())
      .then(({ orders: data, error }) => {
        if (error) { setFetchError(error); return; }
        setOrders(data ?? []);
      })
      .catch((e) => setFetchError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      (o.trackingNumber ?? "").toLowerCase().includes(q);
    const matchStage = stageFilter === "All" || o.orderStage === stageFilter;
    return matchSearch && matchStage;
  });

  const pendingPayment = orders.filter((o) => o.paymentSent && !o.paymentReceived).length;
  const activeOrders = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.orderStage));

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted, #7a6a5a)", fontSize: "0.88rem" }}>Loading orders…</div>;
  if (fetchError) return <div style={{ padding: "1.5rem", background: "#fee2e2", borderRadius: 8, color: "#991b1b", fontFamily: "monospace", fontSize: 13 }}>Error: {fetchError}</div>;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Orders", value: orders.length },
          { label: "Pending", value: orders.filter((o) => o.orderStage === "Pending").length },
          { label: "Active", value: activeOrders.length },
          { label: "Payment Awaiting Confirmation", value: pendingPayment, highlight: pendingPayment > 0 },
        ].map((s) => (
          <div key={s.label} style={{ background: s.highlight ? "#fff3cd" : "var(--bg-card, #f5f0e8)", border: `1px solid ${s.highlight ? "#ffc107" : "var(--border, #e4d8c8)"}`, borderRadius: 10, padding: "0.85rem 1.25rem", minWidth: 140 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.highlight ? "#856404" : "var(--brand, #6B1F2A)" }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #7a6a5a)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by ID, name, email, tracking…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "0.5rem 1rem", border: "1.5px solid var(--border, #e4d8c8)", borderRadius: "999px", fontSize: "0.82rem", outline: "none" }}
        />
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {(["All", ...ORDER_STAGES_WITH_CANCEL] as (OrderStage | "All")[]).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              style={{
                padding: "0.25rem 0.65rem", borderRadius: "999px", border: "1.5px solid",
                borderColor: stageFilter === s ? "var(--brand, #6B1F2A)" : "var(--border, #e4d8c8)",
                background: stageFilter === s ? "var(--brand, #6B1F2A)" : "white",
                color: stageFilter === s ? "#fff" : s === "Cancelled" ? "#991b1b" : "inherit",
                fontSize: "0.72rem", fontWeight: stageFilter === s ? 600 : 400, cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted, #7a6a5a)", fontSize: "0.88rem" }}>No orders found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((order) => (
            <AdminOrderCard
              key={order.orderId}
              order={order}
              expanded={expanded.has(order.orderId)}
              onToggle={() => setExpanded((prev) => {
                const next = new Set(prev);
                next.has(order.orderId) ? next.delete(order.orderId) : next.add(order.orderId);
                return next;
              })}
              onUpdated={(updated) => setOrders((prev) => prev.map((o) => o.orderId === updated.orderId ? updated : o))}
              onDeleted={(orderId) => setOrders((prev) => prev.filter((o) => o.orderId !== orderId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminOrderCard({
  order, expanded, onToggle, onUpdated, onDeleted,
}: {
  order: WholesaleOrder;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (o: WholesaleOrder) => void;
  onDeleted: (orderId: string) => void;
}) {
  const [stageSel, setStageSel] = useState<OrderStage>(order.orderStage);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isCancelled = order.orderStage === "Cancelled";
  const stageColors = STAGE_COLOR[order.orderStage] ?? { bg: "#e0e0e0", text: "#555" };
  const formattedDate = (() => {
    try {
      return new Date(order.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    } catch { return order.createdAt; }
  })();

  const stageIdx = ORDER_STAGES.indexOf(order.orderStage);

  function saveStage() {
    startTransition(async () => {
      try {
        await adminUpdateOrderStage(order.orderId, stageSel);
        onUpdated({ ...order, orderStage: stageSel });
        toast.success("Stage updated");
      } catch (e) { toast.error(String(e)); }
    });
  }

  function saveTracking() {
    startTransition(async () => {
      try {
        await adminUpdateTracking(order.orderId, tracking || null);
        onUpdated({ ...order, trackingNumber: tracking || null });
        toast.success("Tracking saved");
      } catch (e) { toast.error(String(e)); }
    });
  }

  function confirmPaymentReceived() {
    startTransition(async () => {
      try {
        await adminConfirmPaymentReceived(order.orderId, !order.paymentReceived);
        onUpdated({ ...order, paymentReceived: !order.paymentReceived });
        toast.success(order.paymentReceived ? "Payment receipt undone" : "Payment confirmed received");
      } catch (e) { toast.error(String(e)); }
    });
  }

  function cancelOrder() {
    startTransition(async () => {
      try {
        await adminCancelWholesaleOrder(order.orderId);
        onUpdated({ ...order, orderStage: "Cancelled" });
        setStageSel("Cancelled");
        toast.success("Order cancelled — inventory restored");
      } catch (e) { toast.error(String(e)); }
    });
  }

  function deleteOrder() {
    startTransition(async () => {
      try {
        await adminDeleteWholesaleOrder(order.orderId);
        onDeleted(order.orderId);
        toast.success("Order deleted — inventory restored");
      } catch (e) { toast.error(String(e)); setConfirmDelete(false); }
    });
  }

  return (
    <div style={{
      background: "white", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      borderLeft: `4px solid ${isCancelled ? "#dc2626" : order.asap ? "#e65100" : order.paymentSent && !order.paymentReceived ? "#ffc107" : "var(--brand, #6B1F2A)"}`,
      overflow: "hidden", opacity: isCancelled ? 0.75 : 1,
    }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.875rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700 }}>{order.orderId}</span>
          <span style={{ fontSize: "0.74rem", color: "var(--text-muted, #7a6a5a)" }}>{order.customerName}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #7a6a5a)" }}>{formattedDate}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #7a6a5a)" }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""} — ${order.grandTotal.toFixed(2)}</span>
          {order.asap && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#e65100", background: "#fff3cd", padding: "1px 7px", borderRadius: "999px" }}>⚡ ASAP</span>}
          <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: stageColors.bg, color: stageColors.text }}>{order.orderStage}</span>
          {order.paymentSent && !order.paymentReceived && (
            <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: "#fff3cd", color: "#856404" }}>💸 Payment Sent</span>
          )}
          {order.paymentReceived && (
            <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: "#d4edda", color: "#155724" }}>✓ Paid</span>
          )}
        </div>
        {expanded ? <ChevronUp size={15} style={{ color: "var(--text-muted, #7a6a5a)", flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted, #7a6a5a)", flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border, #e4d8c8)" }}>

          {/* Stage tracker (only for non-cancelled orders) */}
          {!isCancelled && (
            <div style={{ display: "flex", alignItems: "flex-start", margin: "1rem 0", gap: 0 }}>
              {ORDER_STAGES.map((s, i) => {
                const done = i < stageIdx;
                const active = i === stageIdx;
                return (
                  <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", fontSize: "0.58rem", color: done ? "#2e7d32" : active ? "var(--brand, #6B1F2A)" : "#aaa", textAlign: "center", gap: "0.3rem", fontWeight: active ? 700 : 400 }}>
                    {i < ORDER_STAGES.length - 1 && (
                      <div style={{ position: "absolute", top: 10, left: "50%", width: "100%", height: 2, background: done ? "#2e7d32" : "#e0e0e0", zIndex: 0 }} />
                    )}
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid", borderColor: done ? "#2e7d32" : active ? "var(--brand, #6B1F2A)" : "#ddd", background: done ? "#2e7d32" : active ? "var(--brand, #6B1F2A)" : "white", color: (done || active) ? "white" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, zIndex: 1, position: "relative" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{ lineHeight: 1.2 }}>{s}</span>
                  </div>
                );
              })}
            </div>
          )}

          {isCancelled && (
            <div style={{ margin: "1rem 0", padding: "0.6rem 0.875rem", background: "#fee2e2", borderRadius: 7, fontSize: "0.8rem", color: "#991b1b", fontWeight: 600 }}>
              ✕ This order has been cancelled. Inventory has been restored.
            </div>
          )}

          {/* Item table */}
          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border, #e4d8c8)", background: "#faf6f1" }}>
                  <th style={{ padding: "5px 8px", textAlign: "left" }}>Design</th>
                  <th style={{ padding: "5px 8px", textAlign: "center" }}>SKU</th>
                  <th style={{ padding: "5px 8px", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "5px 8px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border, #e4d8c8)" }}>
                    <td style={{ padding: "5px 8px" }}>{item.designName}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", fontSize: "0.74rem", color: "var(--text-muted, #7a6a5a)" }}>{item.productId}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center" }}>{item.qty}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>${item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: "right", margin: "0.5rem 0 0", fontWeight: 700, fontSize: "0.95rem" }}>
              Grand Total: <span style={{ color: "var(--brand, #6B1F2A)" }}>${order.grandTotal.toFixed(2)}</span>
            </p>
          </div>

          {/* Admin controls */}
          <div style={{ borderTop: "1px solid var(--border, #e4d8c8)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

            {!isCancelled && (
              <>
                {/* Stage */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label style={lbl}>Stage</label>
                  <select value={stageSel} onChange={(e) => setStageSel(e.target.value as OrderStage)} style={ctrl}>
                    {ORDER_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={saveStage} disabled={isPending || stageSel === order.orderStage} style={saveBtn}>
                    <Save size={12} /> Save
                  </button>
                </div>

                {/* Tracking */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label style={lbl}>Tracking</label>
                  <input
                    type="text" value={tracking} onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter tracking number…"
                    style={{ ...ctrl, flex: 1, minWidth: 160 }}
                  />
                  <button onClick={saveTracking} disabled={isPending} style={saveBtn}>
                    <Save size={12} /> Save
                  </button>
                </div>

                {/* Payment */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label style={lbl}>Payment</label>
                  <span style={{ fontSize: "0.74rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 600, background: order.paymentSent ? "#fff3cd" : "#f8d7da", color: order.paymentSent ? "#856404" : "#721c24" }}>
                    {order.paymentSent ? "Sent by account" : "Not sent"}
                  </span>
                  {order.paymentSentDate && <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #7a6a5a)" }}>{order.paymentSentDate}</span>}
                  {order.paymentSent && (
                    <button
                      onClick={confirmPaymentReceived} disabled={isPending}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.3rem 0.75rem", background: order.paymentReceived ? "white" : "#155724", color: order.paymentReceived ? "#155724" : "white", border: order.paymentReceived ? "1px solid #155724" : "none", borderRadius: 6, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      <Check size={12} /> {order.paymentReceived ? "Received ✓" : "Confirm Received"}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Danger zone — cancel + delete */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px dashed #f5c6c6", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
              {!isCancelled && (
                <button
                  onClick={cancelOrder} disabled={isPending}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.3rem 0.75rem", background: "white", color: "#b45309", border: "1px solid #f59e0b", borderRadius: 6, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <XCircle size={13} /> Cancel Order
                </button>
              )}

              {confirmDelete ? (
                <>
                  <span style={{ fontSize: "0.74rem", color: "#991b1b", fontWeight: 600 }}>Delete permanently?</span>
                  <button
                    onClick={deleteOrder} disabled={isPending}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.3rem 0.75rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    <Trash2 size={12} /> Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ padding: "0.3rem 0.6rem", background: "white", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.74rem", cursor: "pointer" }}
                  >
                    No, Keep
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.3rem 0.75rem", background: "white", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Trash2 size={13} /> Delete Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  fontSize: "0.72rem", fontWeight: 600,
  color: "var(--text-muted, #7a6a5a)",
  minWidth: 65, flexShrink: 0,
  textTransform: "uppercase", letterSpacing: "0.05em",
};
const ctrl: React.CSSProperties = {
  padding: "0.35rem 0.6rem", border: "1px solid var(--border, #e4d8c8)",
  borderRadius: 6, fontSize: "0.8rem", outline: "none", background: "white",
};
const saveBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "0.35rem 0.7rem",
  background: "var(--brand, #6B1F2A)", color: "#fff",
  border: "none", borderRadius: 6, fontSize: "0.74rem",
  fontWeight: 600, cursor: "pointer", flexShrink: 0,
};
