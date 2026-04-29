"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { PublicSuggestion } from "@/lib/admin/types";
import { IDEA_CATEGORIES, type IdeaCategory } from "@/lib/admin/types";

export function SuggestionsView({ suggestions: initialSuggestions }: { suggestions: PublicSuggestion[] }) {
  const [suggestions, setSuggestions] = useState<PublicSuggestion[]>(initialSuggestions);
  const [convertTarget, setConvertTarget] = useState<PublicSuggestion | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);

  const filtered = showReviewed ? suggestions : suggestions.filter((s) => !s.reviewed);

  async function markReviewed(id: string) {
    const sb = createSupabaseBrowser();
    const { error } = await sb.from("public_suggestions").update({ reviewed: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, reviewed: true } : s));
    toast.success("Marked as reviewed");
  }

  const unreviewed = suggestions.filter((s) => !s.reviewed).length;

  return (
    <div style={{ padding: "1.25rem", maxWidth: 800, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total",      value: suggestions.length },
          { label: "Unreviewed", value: unreviewed, accent: "#3949ab" },
          { label: "Reviewed",   value: suggestions.length - unreviewed, accent: "#16a34a" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: "#9a7080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: s.accent ?? "#2a1a0e", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => setShowReviewed(!showReviewed)}
          style={{ padding: "5px 12px", borderRadius: 16, border: "1px solid", borderColor: showReviewed ? "#6b1d3b" : "#e8ddd5", background: showReviewed ? "#6b1d3b" : "#fff", color: showReviewed ? "#fff" : "#6b4050", fontSize: "0.75rem", fontWeight: showReviewed ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}
        >
          {showReviewed ? "Showing all" : "Show reviewed"}
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9a7080", fontSize: "0.9rem" }}>
          {showReviewed ? "No suggestions." : "No unreviewed suggestions — you're all caught up!"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((s) => (
            <div
              key={s.id}
              style={{
                background: "#fff",
                border: "1px solid #e8ddd5",
                borderRadius: 10,
                padding: "1rem",
                opacity: s.reviewed ? 0.6 : 1,
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: "0.88rem", color: "#2a1a0e", lineHeight: 1.5 }}>
                {s.message}
              </p>
              <p style={{ margin: "0 0 10px", fontSize: "0.72rem", color: "#9a7080" }}>
                {s.name ?? "Anonymous"}
                {s.email ? ` · ${s.email}` : ""}
                {" · "}
                {new Date(s.created_at).toLocaleDateString()}
                {s.reviewed && " · Reviewed"}
                {s.converted_to_idea_id && " · Converted to idea"}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {!s.reviewed && (
                  <button
                    onClick={() => markReviewed(s.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: "transparent", border: "1px solid #16a34a", color: "#16a34a", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <Check size={12} />
                    Mark reviewed
                  </button>
                )}
                {!s.converted_to_idea_id && (
                  <button
                    onClick={() => setConvertTarget(s)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: "transparent", border: "1px solid #6b1d3b", color: "#6b1d3b", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <Plus size={12} />
                    Add as idea
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {convertTarget && (
        <ConvertToIdeaModal
          suggestion={convertTarget}
          onClose={() => setConvertTarget(null)}
          onConverted={(ideaId) => {
            setSuggestions((prev) =>
              prev.map((s) => s.id === convertTarget.id ? { ...s, reviewed: true, converted_to_idea_id: ideaId } : s)
            );
            setConvertTarget(null);
          }}
        />
      )}
    </div>
  );
}

function ConvertToIdeaModal({
  suggestion,
  onClose,
  onConverted,
}: {
  suggestion: PublicSuggestion;
  onClose: () => void;
  onConverted: (ideaId: string) => void;
}) {
  const sb = createSupabaseBrowser();
  const [text, setText]         = useState(suggestion.message.slice(0, 120));
  const [category, setCategory] = useState<IdeaCategory>(IDEA_CATEGORIES[0]);
  const [notes, setNotes]       = useState(suggestion.name ? `Suggested by ${suggestion.name}` : "");
  const [saving, setSaving]     = useState(false);

  async function handleConvert() {
    if (!text.trim()) { toast.error("Idea text required"); return; }
    setSaving(true);
    try {
      const { data: idea, error: iErr } = await sb.from("design_ideas").insert({
        idea: text.trim(),
        category,
        notes: notes || null,
        source: "suggestion",
        done: false,
      }).select().single();
      if (iErr) throw iErr;

      const { error: sErr } = await sb
        .from("public_suggestions")
        .update({ reviewed: true, converted_to_idea_id: idea.id })
        .eq("id", suggestion.id);
      if (sErr) throw sErr;

      toast.success("Added as idea");
      onConverted(idea.id);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e" }}>Convert to Design Idea</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4, fontSize: "1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={labelStyle}>Idea Text</label>
            <input value={text} onChange={(e) => setText(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as IdeaCategory)} style={inputStyle}>
              {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" }}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleConvert} disabled={saving} style={primaryBtn}>{saving ? "Converting…" : "Add as Idea"}</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
