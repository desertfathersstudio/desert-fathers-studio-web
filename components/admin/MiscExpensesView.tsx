"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export interface MiscExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = ["Packaging", "Shipping Supplies", "Marketing", "Software", "Equipment", "Fees", "Other"];

export function MiscExpensesView({ expenses: initialExpenses }: { expenses: MiscExpense[] }) {
  const [expenses, setExpenses] = useState<MiscExpense[]>(initialExpenses);
  const [addOpen, setAddOpen] = useState(false);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses
    .filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, e) => s + e.amount, 0);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    const sb = createSupabaseBrowser();
    const { error } = await sb.from("misc_expenses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  }

  return (
    <div style={{ padding: "1.25rem", maxWidth: 800, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Spent",  value: `$${total.toFixed(2)}` },
          { label: "This Month",   value: `$${thisMonth.toFixed(2)}` },
          { label: "# Entries",    value: expenses.length },
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
          onClick={() => setAddOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Plus size={14} />
          Add Expense
        </button>
      </div>

      {/* List */}
      {expenses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9a7080", fontSize: "0.9rem" }}>No expenses logged.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {expenses.map((expense) => (
            <div key={expense.id} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#2a1a0e" }}>{expense.description}</p>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6b4050", background: "#f5ece8", borderRadius: 4, padding: "2px 6px" }}>{expense.category}</span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9a7080" }}>
                  {expense.date}
                  {expense.notes ? ` — ${expense.notes}` : ""}
                </p>
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#2a1a0e", flexShrink: 0 }}>${expense.amount.toFixed(2)}</p>
              <button
                onClick={() => handleDelete(expense.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, flexShrink: 0, opacity: 0.6 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddExpenseModal
          onClose={() => setAddOpen(false)}
          onAdded={(e) => { setExpenses((prev) => [e, ...prev]); setAddOpen(false); }}
        />
      )}
    </div>
  );
}

function AddExpenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: MiscExpense) => void }) {
  const sb = createSupabaseBrowser();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!description.trim()) { toast.error("Enter a description"); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const { data, error } = await sb
        .from("misc_expenses")
        .insert({ description: description.trim(), amount: amt, category, notes: notes.trim() || null, date })
        .select()
        .single();
      if (error) throw error;
      toast.success("Expense added");
      onAdded(data as MiscExpense);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <p style={titleStyle}>Add Expense</p>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <Label>Description</Label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Poly mailers" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Amount ($)</Label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <Label>Date</Label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }} />
          </div>
        </div>
        <div style={footerStyle}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleAdd} disabled={saving} style={primaryBtn}>{saving ? "Adding…" : "Add Expense"}</button>
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
