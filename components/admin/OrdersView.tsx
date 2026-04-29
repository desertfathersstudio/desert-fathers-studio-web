"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Truck, CheckCircle2, Package, XCircle, Trash2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { MfgOrder, OrderStatus, Supplier } from "@/lib/admin/types";
import { NewOrderModal } from "./NewOrderModal";

type MinProduct = { id: string; sku: string; name: string; image_url: string | null };

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ordered:   { label: "Ordered",   color: "#3949ab", bg: "rgba(99,73,171,0.1)",  icon: Package },
  shipped:   { label: "Shipped",   color: "#b45309", bg: "rgba(180,83,9,0.1)",   icon: Truck },
  delivered: { label: "Delivered", color: "#16a34a", bg: "rgba(22,163,74,0.1)",  icon: CheckCircle2 },
  canceled:  { label: "Canceled",  color: "#dc2626", bg: "rgba(220,38,38,0.1)",  icon: XCircle },
};

const STATUS_ORDER: OrderStatus[] = ["ordered", "shipped", "delivered", "canceled"];

function getTrackingUrl(trackingNumber: string): string {
  const n = trackingNumber.trim().toUpperCase();
  if (n.startsWith("1Z")) return `https://www.ups.com/track?tracknum=${n}`;
  if (/^\d{20,22}$/.test(n) || /^92\d{18,20}$/.test(n) || /^94\d{20}$/.test(n)) {
    return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${n}`;
  }
  if (/^\d{12,15}$/.test(n) || /^\d{20}$/.test(n)) {
    return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${n}`;
  }
  return `https://t.17track.net/en#nums=${n}`;
}

export function OrdersView({
  orders: initialOrders,
  suppliers,
  products,
}: {
  orders: MfgOrder[];
  suppliers: Supplier[];
  products: MinProduct[];
}) {
  const [orders, setOrders] = useState<MfgOrder[]>(initialOrders);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});
  const [trackingSaving, setTrackingSaving] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeliver(orderId: string) {
    const sb = createSupabaseBrowser();
    try {
      const { error } = await sb.rpc("deliver_order", { p_order_id: orderId });
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "delivered", arrival_date: o.arrival_date ?? new Date().toISOString().slice(0, 10) }
            : o
        )
      );
      toast.success("Order marked as delivered — inventory updated");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to deliver order");
    }
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    const sb = createSupabaseBrowser();
    try {
      const { error } = await sb.from("mfg_orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      toast.success("Status updated");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to update status");
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    const sb = createSupabaseBrowser();
    try {
      const { error } = await sb.from("mfg_orders").delete().eq("id", orderId);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Order deleted");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to delete");
    }
  }

  async function handleSaveTracking(orderId: string) {
    const tracking = trackingEdits[orderId]?.trim() ?? "";
    setTrackingSaving((prev) => ({ ...prev, [orderId]: true }));
    const sb = createSupabaseBrowser();
    try {
      const { error } = await sb
        .from("mfg_orders")
        .update({ tracking_number: tracking || null })
        .eq("id", orderId);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_number: tracking || null } : o))
      );
      setTrackingEdits((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
      toast.success("Tracking saved");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to save tracking");
    } finally {
      setTrackingSaving((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  function handleOrderAdded(order: MfgOrder) {
    setOrders((prev) => [order, ...prev]);
    setNewOrderOpen(false);
  }

  const totalOrdered = orders.filter((o) => o.status === "ordered").length;
  const totalShipped = orders.filter((o) => o.status === "shipped").length;
  const totalCost = orders
    .filter((o) => o.status !== "canceled")
    .reduce((s, o) => s + (o.total_cost ?? 0), 0);

  return (
    <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Active Orders", value: totalOrdered, accent: "#3949ab" },
          { label: "In Transit",    value: totalShipped, accent: "#b45309" },
          { label: "Total Orders",  value: orders.length },
          { label: "Total Spent",   value: `$${totalCost.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: "#9a7080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: s.accent ?? "#2a1a0e", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={() => setNewOrderOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, background: "#6b1d3b",
            color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <Plus size={14} />
          New Order
        </button>
      </div>

      {/* Order cards */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9a7080", fontSize: "0.9rem" }}>
          No orders yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {orders.map((order) => {
            const meta = STATUS_META[order.status];
            const StatusIcon = meta.icon;
            const isExpanded = expanded.has(order.id);
            const trackingValue = order.id in trackingEdits ? trackingEdits[order.id] : (order.tracking_number ?? "");
            const trackingDirty = order.id in trackingEdits && trackingEdits[order.id] !== (order.tracking_number ?? "");

            return (
              <div
                key={order.id}
                style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, overflow: "hidden" }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: "flex", flexWrap: "wrap", gap: "0.75rem",
                    alignItems: "center", padding: "0.875rem 1rem", cursor: "pointer",
                  }}
                  onClick={() => toggleExpand(order.id)}
                >
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: meta.bg, color: meta.color,
                      borderRadius: 6, padding: "3px 9px",
                      fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
                    }}
                  >
                    <StatusIcon size={11} />
                    {meta.label}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#2a1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.order_id}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a7080" }}>
                      {order.suppliers?.name ?? "No supplier"} · {order.order_date}
                      {order.arrival_date ? ` → ${order.arrival_date}` : ""}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#2a1a0e" }}>
                      {order.total_cost != null ? `$${order.total_cost.toFixed(2)}` : "—"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a7080" }}>{order.total_qty ?? "?"} units</p>
                  </div>

                  <div style={{ color: "#9a7080" }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #f0e8e0", padding: "0.875rem 1rem" }}>

                    {/* Items */}
                    {(order.mfg_order_items ?? []).length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={sectionLabel}>Items</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {(order.mfg_order_items ?? []).map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "0.4rem 0.5rem", borderRadius: 7, background: "#fdf8f4",
                              }}
                            >
                              {item.products?.image_url ? (
                                <img src={item.products.image_url} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 5, background: "#fff", flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: 5, background: "#e8ddd5", flexShrink: 0 }} />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#2a1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.products?.name ?? "Unknown"}
                                </p>
                                <p style={{ margin: 0, fontSize: "0.7rem", color: "#9a7080" }}>
                                  {item.products?.sku} · {item.item_type}
                                </p>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#2a1a0e" }}>×{item.qty_ordered}</p>
                                {item.total_line_cost != null && (
                                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#9a7080" }}>${item.total_line_cost.toFixed(2)}</p>
                                )}
                              </div>
                              {item.received && (
                                <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={sectionLabel}>Notes</p>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#4a3040", lineHeight: 1.5 }}>{order.notes}</p>
                      </div>
                    )}

                    {/* Tracking number — editable */}
                    <div style={{ marginBottom: "1rem" }}>
                      <p style={sectionLabel}>Tracking Number</p>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          value={trackingValue}
                          onChange={(e) => setTrackingEdits((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Enter tracking number…"
                          style={{
                            flex: 1, padding: "6px 10px", border: "1px solid #e8ddd5",
                            borderRadius: 7, fontSize: "0.82rem", fontFamily: "monospace",
                            color: "#2a1a0e", background: "#fdf8f4", outline: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {trackingDirty && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveTracking(order.id); }}
                            disabled={trackingSaving[order.id]}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "6px 10px", borderRadius: 7,
                              background: "#6b1d3b", color: "#fff",
                              border: "none", fontSize: "0.78rem", fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                            }}
                          >
                            <Save size={12} />
                            {trackingSaving[order.id] ? "Saving…" : "Save"}
                          </button>
                        )}
                        {trackingValue && !trackingDirty && (
                          <a
                            href={getTrackingUrl(trackingValue)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "6px 10px", borderRadius: 7,
                              background: "transparent", color: "#3949ab",
                              border: "1px solid #c7d2fe", fontSize: "0.78rem", fontWeight: 500,
                              cursor: "pointer", fontFamily: "inherit", textDecoration: "none", whiteSpace: "nowrap",
                            }}
                          >
                            <ExternalLink size={12} />
                            Track
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      {order.status !== "delivered" && order.status !== "canceled" && (
                        <button
                          onClick={() => handleDeliver(order.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 7,
                            background: "#16a34a", color: "#fff",
                            border: "none", fontSize: "0.78rem", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Mark Delivered
                        </button>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STATUS_ORDER.filter((s) => s !== order.status).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(order.id, s)}
                            style={{
                              padding: "5px 10px", borderRadius: 6,
                              background: "transparent", border: "1px solid #e8ddd5",
                              color: "#6b4050", fontSize: "0.72rem", fontWeight: 500,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            → {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                      <div style={{ flex: 1 }} />
                      <button
                        onClick={() => handleDelete(order.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "5px 10px", borderRadius: 6,
                          background: "transparent", border: "1px solid #fecaca",
                          color: "#dc2626", fontSize: "0.72rem", fontWeight: 500,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {newOrderOpen && (
        <NewOrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setNewOrderOpen(false)}
          onAdded={handleOrderAdded}
        />
      )}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  margin: "0 0 0.4rem",
  fontSize: "0.68rem",
  fontWeight: 700,
  color: "#6b4050",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  fontFamily: "Inter, system-ui, sans-serif",
};
