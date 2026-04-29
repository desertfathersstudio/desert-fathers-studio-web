"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { GiftsLog } from "@/lib/admin/types";
import { GIVEAWAY_REASONS } from "@/lib/admin/types";

type MinProduct = { id: string; sku: string; name: string; image_url: string | null };

export function GiveawaysView({
  giveaways: initialGiveaways,
  products,
}: {
  giveaways: GiftsLog[];
  products: MinProduct[];
}) {
  const [giveaways, setGiveaways] = useState<GiftsLog[]>(initialGiveaways);
  const [logOpen, setLogOpen]     = useState(false);

  // Stats
  const totalQty = giveaways.reduce((s, g) => s + g.qty, 0);
  const thisMonth = giveaways.filter((g) => g.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, g) => s + g.qty, 0);

  async function handleDelete(id: string) {
    if (!confirm("Delete this giveaway entry?")) return;
    const sb = createSupabaseBrowser();
    const { error } = await sb.from("gifts_log").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setGiveaways((prev) => prev.filter((g) => g.id !== id));
    toast.success("Entry deleted");
  }

  return (
    <div style={{ padding: "1.25rem", maxWidth: 800, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Given",      value: totalQty },
          { label: "This Month",       value: thisMonth },
          { label: "Total Entries",    value: giveaways.length },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: "#9a7080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#2a1a0e", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={() => setLogOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Plus size={14} />
          Log Giveaway
        </button>
      </div>

      {/* List */}
      {giveaways.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9a7080", fontSize: "0.9rem" }}>No giveaways logged.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {giveaways.map((g) => (
            <div key={g.id} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "0.88rem", color: "#2a1a0e" }}>
                  {g.products?.name ?? "Unknown"}
                  <span style={{ marginLeft: 8, fontWeight: 400, color: "#9a7080", fontSize: "0.78rem" }}>×{g.qty}</span>
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a7080" }}>
                  {g.date} · {g.reason}
                  {g.recipient ? ` · ${g.recipient}` : ""}
                  {g.notes ? ` — ${g.notes}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDelete(g.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, flexShrink: 0, opacity: 0.6 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {logOpen && (
        <LogGiveawayModal
          products={products}
          onClose={() => setLogOpen(false)}
          onLogged={(entry) => {
            setGiveaways((prev) => [entry, ...prev]);
            setLogOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LogGiveawayModal({
  products,
  onClose,
  onLogged,
}: {
  products: MinProduct[];
  onClose: () => void;
  onLogged: (g: GiftsLog) => void;
}) {
  const sb = createSupabaseBrowser();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty]             = useState(1);
  const [recipient, setRecipient] = useState("");
  const [reason, setReason]       = useState<string>(GIVEAWAY_REASONS[0]);
  const [notes, setNotes]         = useState("");
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]       = useState(false);

  async function handleLog() {
    if (!productId) { toast.error("Select a product"); return; }
    setSaving(true);
    try {
      const { error, data } = await sb.rpc("log_giveaway", {
        product_id: productId,
        qty,
        recipient: recipient || null,
        reason,
        notes: notes || null,
        date,
      });
      if (error) throw error;

      // Fetch the inserted row with product join
      const { data: entry } = await sb
        .from("gifts_log")
        .select("*, products(name, sku)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      toast.success("Giveaway logged — inventory updated");
      if (entry) onLogged(entry as GiftsLog);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <p style={titleStyle}>Log Giveaway</p>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <Label>Design</Label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} style={inputStyle}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Qty</Label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <Label>Date</Label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle}>
              {GIVEAWAY_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label>Recipient (optional)</Label>
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Name or org" style={inputStyle} />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }} />
          </div>
        </div>
        <div style={footerStyle}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleLog} disabled={saving} style={primaryBtn}>{saving ? "Logging…" : "Log Giveaway"}</button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>;
}

const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", overflow: "hidden" };
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" };
const footerStyle: React.CSSProperties = { display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4, fontSize: "1rem" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
