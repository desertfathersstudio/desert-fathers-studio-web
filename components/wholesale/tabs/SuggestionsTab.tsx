"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { WholesaleProduct } from "@/types/wholesale";

const TYPES = ["New Design Idea", "Fix Needed", "Pack Idea", "General Feedback"] as const;
const PRIORITIES = ["Low", "Medium", "High"] as const;

const TYPE_TEMPLATES: Record<string, string> = {
  "New Design Idea": "New Design: I would love to see a sticker of [subject/scene]. Category: ",
  "Fix Needed":      "Fix: The [design name] needs: ",
  "Pack Idea":       "Pack Idea: A pack themed around [theme] could include: ",
};

const QUICK_FILLS = [
  { label: "Color Fix",  fill: "Color Fix: The [design name] has an issue with its coloring. Specifically: " },
  { label: "New Design", fill: "New Design: I would love to see a sticker of [subject/scene]. Category: " },
  { label: "Pack Idea",  fill: "Pack Idea: A pack themed around [theme] could include: " },
];

interface Props {
  products: WholesaleProduct[];
  accountId: string;
}

export function SuggestionsTab({ products, accountId }: Props) {
  const [type, setType] = useState<string>("New Design Idea");
  const [priority, setPriority] = useState<string>("Medium");
  const [relatedDesign, setRelatedDesign] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const approvedNames = products
    .filter((p) => p.reviewStatus === "approved" || !p.reviewStatus)
    .filter((p) => !p.packOnly && !p.isPackProduct)
    .map((p) => p.name);

  function handleTypeChange(newType: string) {
    setType(newType);
    if (!message.trim() && TYPE_TEMPLATES[newType]) {
      setMessage(TYPE_TEMPLATES[newType]);
    }
  }

  async function handleSubmit() {
    if (!message.trim()) { toast.error("Please write a message"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wholesale/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, type, priority, relatedDesign, message }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("");
      setType("New Design Idea");
      setPriority("Medium");
      setRelatedDesign("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "1.75rem",
            fontWeight: 500,
            color: "var(--text)",
            margin: "0 0 0.3rem",
            letterSpacing: "0.01em",
          }}
        >
          Suggestions &amp; Feedback
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, fontFamily: "var(--font-inter)" }}>
          Help improve the catalog — every submission is reviewed.
        </p>
      </div>

      {success && (
        <div
          role="alert"
          style={{
            background: "#f0f9f4",
            border: "1px solid #b8dbc5",
            borderRadius: "var(--radius-card)",
            padding: "0.875rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            color: "#2c5f3a",
            fontWeight: 600,
            fontFamily: "var(--font-inter)",
          }}
        >
          Suggestion saved. We'll review it shortly.
        </div>
      )}

      {/* Form — flat, no card wrapper */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Type + Priority */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={fieldLabel}>Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              style={inputStyle}
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)" }} />

        {/* Related design */}
        <div>
          <label style={fieldLabel}>Related Design (optional)</label>
          <select value={relatedDesign} onChange={(e) => setRelatedDesign(e.target.value)} style={inputStyle}>
            <option value="">— None —</option>
            {approvedNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Quick fill */}
        <div>
          <label style={fieldLabel}>Quick fill</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
            {QUICK_FILLS.map((q) => (
              <button
                key={q.label}
                onClick={() => setMessage(q.fill)}
                style={{
                  padding: "0.3rem 0.85rem",
                  borderRadius: "var(--radius-btn)",
                  border: "1px solid var(--border)",
                  background: "white",
                  fontSize: "0.76rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-inter)",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                  (e.currentTarget as HTMLElement).style.color = "var(--brand)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)" }} />

        {/* Message */}
        <div>
          <label style={fieldLabel}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Be specific: what should change or be added? Include design names, colors, or references."
            style={{
              ...inputStyle,
              width: "100%",
              resize: "vertical",
              minHeight: 120,
              boxSizing: "border-box",
              lineHeight: 1.55,
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "0.9rem",
            background: submitting ? "var(--border)" : "var(--brand)",
            color: submitting ? "var(--text-muted)" : "#fff",
            border: "none",
            borderRadius: "var(--radius-btn)",
            fontSize: "0.88rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "var(--font-inter)",
            transition: "background 0.15s",
          }}
        >
          {submitting ? "Sending…" : "Submit Suggestion"}
        </button>
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  fontFamily: "var(--font-inter)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.85rem",
  fontFamily: "var(--font-inter)",
  color: "var(--text)",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};
