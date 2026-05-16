"use client";

import { useState, useMemo } from "react";
import { X, Plus, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { MfgOrder, OrderStatus, Supplier } from "@/lib/admin/types";

type MinProduct = { id: string; sku: string; name: string; image_url: string | null; categories: { name: string }[] | null };

const ITEM_TYPES = ["full_batch", "sample", "proof", "reprint"] as const;
type ItemType = typeof ITEM_TYPES[number];

interface SelectedLine {
  qty: number;
  item_type: ItemType;
}

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

  // Cost breakdown
  const [totalAmount, setTotalAmount]       = useState("");
  const [taxAmount, setTaxAmount]           = useState("");
  const [shippingAmount, setShippingAmount] = useState("");
  const [samplesAmount, setSamplesAmount]   = useState("");

  // Design multi-select
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selected, setSelected] = useState<Record<string, SelectedLine>>({});

  // Live computed values
  const totalN    = parseFloat(totalAmount)    || 0;
  const taxN      = parseFloat(taxAmount)      || 0;
  const shippingN = parseFloat(shippingAmount) || 0;
  const samplesN  = parseFloat(samplesAmount)  || 0;
  const productCost = Math.max(0, totalN - taxN - shippingN - samplesN);
  const totalQty  = Object.values(selected).reduce((s, l) => s + (l.qty || 0), 0);
  // Per-sticker cost is from the full invoice total (you paid it all for these stickers)
  const perUnitCost = totalQty > 0 && totalN > 0 ? totalN / totalQty : 0;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => { const n = p.categories?.[0]?.name; if (n) cats.add(n); });
    return Array.from(cats).sort();
  }, [products]);

  function stkNum(sku: string) {
    const m = sku.match(/^STK-(\d+)$/i);
    return m ? parseInt(m[1], 10) : null;
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (categoryFilter === "Round 1") {
        const n = stkNum(p.sku);
        if (n === null || n < 1 || n > 35) return false;
      } else if (categoryFilter === "Round 2") {
        const n = stkNum(p.sku);
        if (n === null || n < 36 || n > 67) return false;
      } else if (categoryFilter !== "All") {
        if (p.categories?.[0]?.name !== categoryFilter) return false;
      }
      return !q || p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    });
  }, [products, search, categoryFilter]);

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

  // ── Design selection ───────────────────────────────────────────────────────
  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { qty: 100, item_type: "full_batch" };
      }
      return next;
    });
  }

  function updateLine(id: string, patch: Partial<SelectedLine>) {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!orderId.trim()) { toast.error("Order ID required"); return; }
    if (!totalAmount || totalN <= 0) { toast.error("Enter the total invoice amount"); return; }
    if (Object.keys(selected).length === 0) { toast.error("Select at least one design"); return; }

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

      const itemRows = Object.entries(selected).map(([product_id, line]) => ({
        mfg_order_id:           order.id,
        product_id,
        qty_ordered:            line.qty,
        item_type:              line.item_type,
        unit_cost:              perUnitCost,
        line_base_cost:         perUnitCost * line.qty,
        shipping_allocation:    totalQty > 0 ? (shippingN / totalQty) * line.qty : 0,
        extra_cost_allocation:  0,
        total_line_cost:        perUnitCost * line.qty,
        received:               false,
      }));

      const { data: items, error: iErr } = await sb
        .from("mfg_order_items")
        .insert(itemRows)
        .select("*, products(name, sku, image_url)");
      if (iErr) throw iErr;

      if (status !== "delivered") {
        for (const [product_id, line] of Object.entries(selected)) {
          await sb.rpc("increment_incoming", { p_product_id: product_id, p_qty: line.qty });
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

  const [saving, setSaving] = useState(false);
  const selectedProductMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selectedIds = Object.keys(selected);

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
                <input type="number" min={0} step={0.01} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontWeight: 700 }} />
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
            <div style={{ borderTop: "1px solid #e8ddd5", paddingTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b4050" }}>
                <span>Product cost (excl. fees)</span>
                <strong style={{ color: "#2a1a0e" }}>${productCost.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b4050" }}>
                <span>Total stickers ordered</span>
                <strong style={{ color: "#2a1a0e" }}>{totalQty.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", paddingTop: "0.25rem", borderTop: "1px dashed #e8ddd5", marginTop: "0.125rem" }}>
                <span style={{ fontWeight: 700, color: "#6b1d3b" }}>Per-sticker cost (from total)</span>
                <strong style={{ color: "#6b1d3b", fontSize: "1rem" }}>
                  {totalQty > 0 && totalN > 0 ? `$${perUnitCost.toFixed(4)}` : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* Design multi-select */}
          <div>
            <Label>Designs Ordered ({selectedIds.length} selected)</Label>

            {/* Category filter chips */}
            <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderBottom: "1px solid #e8ddd5", marginBottom: 0 }}>
              {(["All", "Round 1", "Round 2", ...categories] as string[]).map((cat) => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: "0.3rem 0.6rem",
                      border: "none",
                      borderBottom: active ? "2px solid #6b1d3b" : "2px solid transparent",
                      background: "none",
                      color: active ? "#6b1d3b" : "#9a7080",
                      fontSize: "0.72rem",
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "color 120ms",
                    }}
                  >
                    {cat === "Round 1" ? "Round 1 (1–35)" : cat === "Round 2" ? "Round 2 (36–67)" : cat}
                  </button>
                );
              })}
            </div>

            {/* Search + Select All + scrollable checklist */}
            <div style={{ border: "1px solid #e8ddd5", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", marginBottom: selectedIds.length > 0 ? "0.75rem" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderBottom: "1px solid #e8ddd5", background: "#fdf8f4" }}>
                <Search size={13} color="#9a7080" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search designs…"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: "0.82rem", background: "transparent", color: "#2a1a0e" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 0, fontSize: "0.78rem" }}>✕</button>
                )}
                <button
                  onClick={() => {
                    const allVisible = filteredProducts.map((p) => p.id);
                    const allChecked = allVisible.length > 0 && allVisible.every((id) => !!selected[id]);
                    if (allChecked) {
                      setSelected((prev) => {
                        const next = { ...prev };
                        allVisible.forEach((id) => delete next[id]);
                        return next;
                      });
                    } else {
                      setSelected((prev) => {
                        const next = { ...prev };
                        allVisible.forEach((id) => { if (!next[id]) next[id] = { qty: 100, item_type: "full_batch" }; });
                        return next;
                      });
                    }
                  }}
                  style={{ background: "none", border: "1px solid #e8ddd5", borderRadius: 5, cursor: "pointer", color: "#6b1d3b", padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {filteredProducts.length > 0 && filteredProducts.every((p) => !!selected[p.id]) ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div style={{ maxHeight: 180, overflowY: "auto" }}>
                {filteredProducts.length === 0 ? (
                  <p style={{ margin: 0, padding: "0.75rem", fontSize: "0.78rem", color: "#9a7080", textAlign: "center" }}>No designs found.</p>
                ) : (
                  filteredProducts.map((p) => {
                    const isChecked = !!selected[p.id];
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
                          cursor: "pointer", borderBottom: "1px solid #f5f0ea",
                          background: isChecked ? "#fdf3f5" : "white",
                          transition: "background 100ms",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProduct(p.id)}
                          style={{ accentColor: "#6b1d3b", flexShrink: 0 }}
                        />
                        {p.image_url && (
                          <img src={p.image_url} alt="" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4, background: "#f5f0ea", flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: "0.78rem", color: "#2a1a0e", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontFamily: "monospace", color: "#9a7080", marginRight: 4 }}>{p.sku}</span>
                          {p.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected items with qty + type */}
            {selectedIds.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b4050", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quantities &amp; Types</p>
                {selectedIds.map((id) => {
                  const p = selectedProductMap.get(id);
                  if (!p) return null;
                  const line = selected[id];
                  return (
                    <div key={id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 26px", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "#2a1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "monospace", color: "#9a7080", marginRight: 4 }}>{p.sku}</span>
                        {p.name}
                      </span>
                      <input
                        type="number" min={1} value={line.qty}
                        onChange={(e) => updateLine(id, { qty: Number(e.target.value) })}
                        style={{ ...inputStyle, fontSize: "0.78rem", textAlign: "center" }}
                      />
                      <select value={line.item_type} onChange={(e) => updateLine(id, { item_type: e.target.value as ItemType })} style={{ ...inputStyle, fontSize: "0.78rem" }}>
                        {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        onClick={() => toggleProduct(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 0, display: "flex", alignItems: "center", fontSize: "1rem", lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
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
  return <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>;
}

const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 640, maxHeight: "92dvh", display: "flex", flexDirection: "column", overflow: "hidden" };
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" };
const footerStyle: React.CSSProperties = { display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer" };
