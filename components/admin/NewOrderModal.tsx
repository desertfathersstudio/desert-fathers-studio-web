"use client";

import { useState } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { MfgOrder, OrderStatus, Supplier } from "@/lib/admin/types";

type MinProduct = { id: string; sku: string; name: string; image_url: string | null };
type LineItem = { product_id: string; qty_ordered: number; item_type: string };

const ITEM_TYPES = ["full_batch", "sample", "proof", "reprint"] as const;

export function NewOrderModal({
  suppliers: initialSuppliers,
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

  // Order meta
  const [orderId, setOrderId]         = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [orderDate, setOrderDate]     = useState(new Date().toISOString().slice(0, 10));
  const [arrivalDate, setArrivalDate] = useState("");
  const [status, setStatus]           = useState<OrderStatus>("ordered");
  const [notes, setNotes]             = useState("");

  // Supplier
  const [suppliers, setSuppliers]     = useState<Supplier[]>(initialSuppliers);
  const [supplierId, setSupplierId]   = useState(initialSuppliers[0]?.id ?? "");
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Cost breakdown — user enters the invoice total and sub-components
  const [totalAmount, setTotalAmount]   = useState("");
  const [taxAmount, setTaxAmount]       = useState("");
  const [shippingAmount, setShippingAmount] = useState("");
  const [samplesAmount, setSamplesAmount]   = useState("");

  // Line items — no unit cost; cost is split from the total above
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: products[0]?.id ?? "", qty_ordered: 100, item_type: "full_batch" },
  ]);
  const [saving, setSaving] = useState(false);

  // Live computed values
  const totalN    = parseFloat(totalAmount)   || 0;
  const taxN      = parseFloat(taxAmount)     || 0;
  const shippingN = parseFloat(shippingAmount) || 0;
  const samplesN  = parseFloat(samplesAmount)  || 0;
  const productCost = Math.max(0, totalN - taxN - shippingN - samplesN);
  const totalQty    = lines.reduce((s, l) => s + (l.qty_ordered || 0), 0);
  const perUnitCost = totalQty > 0 ? productCost / totalQty : 0;

  // ── Supplier creation ──────────────────────────────────────────────────────
  async function handleCreateSupplier() {
    const name = newSupplierName.trim();
    if (!name) { toast.error("Supplier name required"); return; }
    setCreatingSupplier(true);
    try {
      const { data, error } = await sb
        .from("suppliers")
        .insert({ name })
        .select("id, name, contact_info, notes")
        .single();
      if (error) throw error;
      setSuppliers((prev) => [...prev, data as Supplier]);
      setSupplierId(data.id);
      setNewSupplierName("");
      setAddingSupplier(false);
      toast.success(`Supplier "${name}" added`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  }

  // ── Line item helpers ──────────────────────────────────────────────────────
  function addLine() {
    setLines((prev) => [...prev, { product_id: products[0]?.id ?? "", qty_ordered: 100, item_type: "full_batch" }]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateLine(i: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!orderId.trim()) { toast.error("Order ID required"); return; }
    if (!totalAmount || totalN <= 0) { toast.error("Enter the total invoice amount"); return; }
    if (lines.length === 0) { toast.error("Add at least one item"); return; }

    setSaving(true);
    try {
      const { data: order, error: oErr } = await sb
        .from("mfg_orders")
        .insert({
          order_id:      orderId.trim(),
          supplier_id:   supplierId || null,
          order_date:    orderDate,
          arrival_date:  arrivalDate || null,
          status,
          total_qty:     totalQty,
          total_cost:    totalN,
          base_cost:     productCost,
          shipping:      shippingN,
          extra_costs:   0,
          tax_amount:    taxN,
          samples_cost:  samplesN,
          per_unit_cost: perUnitCost,
          notes:         notes || null,
        })
        .select("*, suppliers(id, name)")
        .single();
      if (oErr) throw oErr;

      const itemRows = lines.map((l) => ({
        mfg_order_id:           order.id,
        product_id:             l.product_id,
        qty_ordered:            l.qty_ordered,
        item_type:              l.item_type,
        unit_cost:              perUnitCost,
        line_base_cost:         perUnitCost * l.qty_ordered,
        shipping_allocation:    totalQty > 0 ? (shippingN / totalQty) * l.qty_ordered : 0,
        extra_cost_allocation:  0,
        total_line_cost:        perUnitCost * l.qty_ordered,
        received:               false,
      }));

      const { data: items, error: iErr } = await sb
        .from("mfg_order_items")
        .insert(itemRows)
        .select("*, products(name, sku, image_url)");
      if (iErr) throw iErr;

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

        <div style={{ padding: "1.125rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>

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

          {/* Supplier */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Label>Supplier</Label>
              <button
                onClick={() => { setAddingSupplier((v) => !v); setNewSupplierName(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "#6b1d3b", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}
              >
                {addingSupplier ? <><ChevronUp size={11} /> Cancel</> : <><Plus size={11} /> Add Supplier</>}
              </button>
            </div>
            {addingSupplier ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="New supplier name…"
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateSupplier(); }}
                  autoFocus
                />
                <button
                  onClick={handleCreateSupplier}
                  disabled={creatingSupplier || !newSupplierName.trim()}
                  style={{ ...primaryBtn, padding: "7px 12px", whiteSpace: "nowrap" }}
                >
                  {creatingSupplier ? "Adding…" : "Add"}
                </button>
              </div>
            ) : (
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inputStyle}>
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Order Date</Label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Est. Arrival</Label>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={{ background: "#fdf8f4", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "#6b4050", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Breakdown</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "0.75rem" }}>
              <div>
                <Label>Invoice Total ($)</Label>
                <input
                  type="number" min={0} step={0.01}
                  value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle, fontWeight: 700 }}
                />
              </div>
              <div>
                <Label>Taxes ($)</Label>
                <input type="number" min={0} step={0.01} value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <Label>Shipping ($)</Label>
                <input type="number" min={0} step={0.01} value={shippingAmount} onChange={(e) => setShippingAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <Label>Samples ($)</Label>
                <input type="number" min={0} step={0.01} value={samplesAmount} onChange={(e) => setSamplesAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>
            </div>

            {/* Computed summary */}
            <div style={{ borderTop: "1px solid #e8ddd5", paddingTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b4050" }}>
                <span>Product cost (total − fees)</span>
                <strong style={{ color: productCost < 0 ? "#dc2626" : "#2a1a0e" }}>${productCost.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b4050" }}>
                <span>Total stickers ordered</span>
                <strong style={{ color: "#2a1a0e" }}>{totalQty.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", paddingTop: "0.25rem", borderTop: "1px dashed #e8ddd5", marginTop: "0.125rem" }}>
                <span style={{ fontWeight: 700, color: "#6b1d3b" }}>Per-sticker cost</span>
                <strong style={{ color: "#6b1d3b", fontSize: "1rem" }}>
                  {totalQty > 0 && totalN > 0 ? `$${perUnitCost.toFixed(4)}` : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Label>Designs Ordered</Label>
              <button onClick={addLine} style={{ ...outlineBtn, padding: "3px 8px", fontSize: "0.72rem" }}>
                <Plus size={11} /> Add Design
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((line, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 110px 28px", gap: 6, alignItems: "center" }}>
                  <select value={line.product_id} onChange={(e) => updateLine(i, { product_id: e.target.value })} style={{ ...inputStyle, fontSize: "0.78rem" }}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                  </select>
                  <input
                    type="number" min={1} value={line.qty_ordered}
                    onChange={(e) => updateLine(i, { qty_ordered: Number(e.target.value) })}
                    placeholder="Qty"
                    style={{ ...inputStyle, fontSize: "0.78rem" }}
                  />
                  <select value={line.item_type} onChange={(e) => updateLine(i, { item_type: e.target.value })} style={{ ...inputStyle, fontSize: "0.78rem" }}>
                    {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => removeLine(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0, display: "flex", alignItems: "center" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            {totalQty > 0 && perUnitCost > 0 && (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: "#9a7080", textAlign: "right" }}>
                Each sticker allocated at <strong>${perUnitCost.toFixed(4)}</strong>
              </p>
            )}
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

const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 620, maxHeight: "92dvh", display: "flex", flexDirection: "column", overflow: "hidden" };
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" };
const footerStyle: React.CSSProperties = { display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
