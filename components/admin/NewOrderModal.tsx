"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { MfgOrder, OrderStatus, Supplier } from "@/lib/admin/types";

type MinProduct = { id: string; sku: string; name: string; image_url: string | null };
type LineItem = { product_id: string; qty_ordered: number; unit_cost: string; item_type: string };

const ITEM_TYPES = ["full_batch", "sample", "proof", "reprint"] as const;

export function NewOrderModal({
  suppliers,
  products,
  onClose,
  onAdded,
}: {
  suppliers: Supplier[];
  products: MinProduct[];
  onClose: () => void;
  onAdded: (order: MfgOrder) => void;
}) {
  const sb = createSupabaseBrowser();

  const [orderId, setOrderId]       = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [orderDate, setOrderDate]   = useState(new Date().toISOString().slice(0, 10));
  const [arrivalDate, setArrivalDate] = useState("");
  const [shipping, setShipping]     = useState("0");
  const [extraCosts, setExtraCosts] = useState("0");
  const [notes, setNotes]           = useState("");
  const [status, setStatus]         = useState<OrderStatus>("ordered");
  const [lines, setLines]           = useState<LineItem[]>([
    { product_id: products[0]?.id ?? "", qty_ordered: 100, unit_cost: "0.38", item_type: "full_batch" },
  ]);
  const [saving, setSaving] = useState(false);

  function addLine() {
    setLines((prev) => [...prev, { product_id: products[0]?.id ?? "", qty_ordered: 100, unit_cost: "0.38", item_type: "full_batch" }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function handleCreate() {
    if (!orderId.trim()) { toast.error("Order ID required"); return; }
    if (lines.length === 0) { toast.error("Add at least one item"); return; }

    setSaving(true);
    try {
      const shippingN = parseFloat(shipping) || 0;
      const extraN    = parseFloat(extraCosts) || 0;
      const totalQty  = lines.reduce((s, l) => s + l.qty_ordered, 0);
      const baseCost  = lines.reduce((s, l) => s + l.qty_ordered * (parseFloat(l.unit_cost) || 0), 0);
      const totalCost = baseCost + shippingN + extraN;

      const { data: order, error: oErr } = await sb
        .from("mfg_orders")
        .insert({
          order_id: orderId.trim(),
          supplier_id: supplierId || null,
          order_date: orderDate,
          arrival_date: arrivalDate || null,
          status,
          total_qty: totalQty,
          base_cost: baseCost,
          shipping: shippingN,
          extra_costs: extraN,
          total_cost: totalCost,
          notes: notes || null,
        })
        .select("*, suppliers(id, name)")
        .single();
      if (oErr) throw oErr;

      const shippingPerUnit = totalQty > 0 ? shippingN / totalQty : 0;
      const extraPerUnit    = totalQty > 0 ? extraN / totalQty : 0;

      const itemRows = lines.map((l) => {
        const unitC = parseFloat(l.unit_cost) || 0;
        const lineBase = l.qty_ordered * unitC;
        const shipAlloc = l.qty_ordered * shippingPerUnit;
        const extraAlloc = l.qty_ordered * extraPerUnit;
        return {
          mfg_order_id: order.id,
          product_id: l.product_id,
          qty_ordered: l.qty_ordered,
          item_type: l.item_type,
          unit_cost: unitC,
          line_base_cost: lineBase,
          shipping_allocation: shipAlloc,
          extra_cost_allocation: extraAlloc,
          total_line_cost: lineBase + shipAlloc + extraAlloc,
          received: false,
        };
      });

      const { data: items, error: iErr } = await sb
        .from("mfg_order_items")
        .insert(itemRows)
        .select("*, products(name, sku, image_url)");
      if (iErr) throw iErr;

      // Increment inventory.incoming for each ordered product (non-delivered orders)
      if (status !== "delivered") {
        for (const line of lines) {
          await sb.rpc("increment_incoming", {
            p_product_id: line.product_id,
            p_qty: line.qty_ordered,
          });
        }
      }

      toast.success("Order created");
      onAdded({ ...order, mfg_order_items: items ?? [] } as MfgOrder);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <p style={titleStyle}>New Manufacturing Order</p>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.125rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          {/* Order ID + status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Order ID</Label>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} style={inputStyle}>
                <option value="ordered">Ordered</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Supplier + dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Supplier</Label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inputStyle}>
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Order Date</Label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Est. Arrival</Label>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Costs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Shipping ($)</Label>
              <input type="number" min={0} step={0.01} value={shipping} onChange={(e) => setShipping(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Extra Costs ($)</Label>
              <input type="number" min={0} step={0.01} value={extraCosts} onChange={(e) => setExtraCosts(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Label>Items</Label>
              <button onClick={addLine} style={{ ...outlineBtn, padding: "3px 8px", fontSize: "0.72rem" }}>
                <Plus size={11} /> Add Item
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((line, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 110px 28px", gap: 6, alignItems: "center" }}>
                  <select value={line.product_id} onChange={(e) => updateLine(i, { product_id: e.target.value })} style={{ ...inputStyle, fontSize: "0.78rem" }}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                  </select>
                  <input type="number" min={1} value={line.qty_ordered} onChange={(e) => updateLine(i, { qty_ordered: Number(e.target.value) })} placeholder="Qty" style={{ ...inputStyle, fontSize: "0.78rem" }} />
                  <input type="number" min={0} step={0.01} value={line.unit_cost} onChange={(e) => updateLine(i, { unit_cost: e.target.value })} placeholder="$/unit" style={{ ...inputStyle, fontSize: "0.78rem" }} />
                  <select value={line.item_type} onChange={(e) => updateLine(i, { item_type: e.target.value })} style={{ ...inputStyle, fontSize: "0.78rem" }}>
                    {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => removeLine(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0, display: "flex", alignItems: "center" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleCreate} disabled={saving} style={primaryBtn}>
            {saving ? "Creating…" : "Create Order"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>;
}

const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 640, maxHeight: "92dvh", display: "flex", flexDirection: "column", overflow: "hidden" };
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" };
const footerStyle: React.CSSProperties = { display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
