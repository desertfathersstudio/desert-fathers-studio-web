"use client";

import { useState, useMemo } from "react";
import { Plus, Check, X, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { DesignIdea, IdeaCategory } from "@/lib/admin/types";
import { IDEA_CATEGORIES } from "@/lib/admin/types";

export function IdeasView({ ideas: initialIdeas }: { ideas: DesignIdea[] }) {
  const [ideas, setIdeas]     = useState<DesignIdea[]>(initialIdeas);
  const [addOpen, setAddOpen] = useState(false);
  const [editIdea, setEditIdea] = useState<DesignIdea | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterDone, setFilterDone] = useState<"all" | "pending" | "done">("pending");

  const filtered = useMemo(() => {
    let list = ideas;
    if (filterCat !== "all") list = list.filter((i) => i.category === filterCat);
    if (filterDone === "pending") list = list.filter((i) => !i.done);
    if (filterDone === "done")    list = list.filter((i) => i.done);
    return list;
  }, [ideas, filterCat, filterDone]);

  async function toggleDone(idea: DesignIdea) {
    const sb = createSupabaseBrowser();
    const done = !idea.done;
    const { error } = await sb.from("design_ideas").update({
      done,
      date_done: done ? new Date().toISOString().slice(0, 10) : null,
    }).eq("id", idea.id);
    if (error) { toast.error(error.message); return; }
    setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, done, date_done: done ? new Date().toISOString().slice(0, 10) : null } : i));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this idea?")) return;
    const sb = createSupabaseBrowser();
    const { error } = await sb.from("design_ideas").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast.success("Idea deleted");
  }

  const pending = ideas.filter((i) => !i.done).length;

  return (
    <div style={{ padding: "1.25rem", maxWidth: 800, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Ideas",   value: ideas.length },
          { label: "Pending",       value: pending,              accent: "#3949ab" },
          { label: "Done",          value: ideas.length - pending, accent: "#16a34a" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: "#9a7080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: s.accent ?? "#2a1a0e", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center", marginBottom: "1rem" }}>
        {/* Done filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["pending", "all", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilterDone(f)} style={{ padding: "5px 10px", borderRadius: 16, border: "1px solid", borderColor: filterDone === f ? "#6b1d3b" : "#e8ddd5", background: filterDone === f ? "#6b1d3b" : "#fff", color: filterDone === f ? "#fff" : "#6b4050", fontSize: "0.75rem", fontWeight: filterDone === f ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
              {f === "all" ? "All" : f === "pending" ? "Pending" : "Done"}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e8ddd5", background: "#fff", color: "#6b4050", fontSize: "0.78rem", fontFamily: "inherit", cursor: "pointer" }}>
          <option value="all">All categories</option>
          {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setAddOpen(true)}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Plus size={14} />
          Add Idea
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9a7080", fontSize: "0.9rem" }}>No ideas here.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map((idea) => (
            <div
              key={idea.id}
              style={{
                background: "#fff",
                border: "1px solid #e8ddd5",
                borderRadius: 10,
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.875rem",
                opacity: idea.done ? 0.6 : 1,
              }}
            >
              {/* Done checkbox */}
              <button
                onClick={() => toggleDone(idea)}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: idea.done ? "#16a34a" : "transparent",
                  border: `2px solid ${idea.done ? "#16a34a" : "#e8ddd5"}`,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {idea.done && <Check size={12} color="#fff" strokeWidth={3} />}
              </button>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "0.88rem", color: "#2a1a0e", textDecoration: idea.done ? "line-through" : "none" }}>
                  {idea.idea}
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a7080" }}>
                  {idea.category}
                  {idea.source ? ` · ${idea.source}` : ""}
                  {idea.notes ? ` — ${idea.notes}` : ""}
                  {idea.date_done ? ` · Done ${idea.date_done}` : ""}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => setEditIdea(idea)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(idea.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, opacity: 0.6 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <IdeaModal
          onClose={() => setAddOpen(false)}
          onSaved={(idea) => { setIdeas((prev) => [idea, ...prev]); setAddOpen(false); }}
        />
      )}
      {editIdea && (
        <IdeaModal
          idea={editIdea}
          onClose={() => setEditIdea(null)}
          onSaved={(updated) => { setIdeas((prev) => prev.map((i) => i.id === updated.id ? updated : i)); setEditIdea(null); }}
        />
      )}
    </div>
  );
}

function IdeaModal({
  idea,
  onClose,
  onSaved,
}: {
  idea?: DesignIdea;
  onClose: () => void;
  onSaved: (i: DesignIdea) => void;
}) {
  const sb = createSupabaseBrowser();
  const [text, setText]       = useState(idea?.idea ?? "");
  const [category, setCategory] = useState<IdeaCategory>((idea?.category as IdeaCategory) ?? IDEA_CATEGORIES[0]);
  const [notes, setNotes]     = useState(idea?.notes ?? "");
  const [source, setSource]   = useState(idea?.source ?? "");
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!text.trim()) { toast.error("Idea text required"); return; }
    setSaving(true);
    try {
      if (idea) {
        const { data, error } = await sb.from("design_ideas").update({ idea: text.trim(), category, notes: notes || null, source: source || "" }).eq("id", idea.id).select().single();
        if (error) throw error;
        onSaved(data as DesignIdea);
      } else {
        const { data, error } = await sb.from("design_ideas").insert({ idea: text.trim(), category, notes: notes || null, source: source || "", done: false }).select().single();
        if (error) throw error;
        onSaved(data as DesignIdea);
      }
      toast.success(idea ? "Idea updated" : "Idea added");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e" }}>{idea ? "Edit Idea" : "Add Idea"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4, fontSize: "1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <Label>Idea *</Label>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Moses crossing the Red Sea" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value as IdeaCategory)} style={inputStyle}>
                {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Source</Label>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. customer, team" style={inputStyle} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" }}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn}>{saving ? "Saving…" : idea ? "Update" : "Add Idea"}</button>
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
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
