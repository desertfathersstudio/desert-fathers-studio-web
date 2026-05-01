"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { WholesaleProduct } from "@/types/wholesale";
import { driveThumbUrl, extractDriveFileId } from "@/lib/wholesale/pricing";

interface Props {
  products: WholesaleProduct[];
  onProductApproved: (id: string) => void;
  onProductsUpdated: (updatedProducts: WholesaleProduct[]) => void;
  accountId: string;
}

type CommentFilter = "All" | "has" | "none";

export function PendingTab({ products, onProductApproved, onProductsUpdated, accountId }: Props) {
  const [statusFilter, setStatusFilter] = useState<CommentFilter>("All");
  const [catFilter, setCatFilter] = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const pending = useMemo(
    () => products.filter((p) => p.reviewStatus === "under_review"),
    [products]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    pending.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [pending]);

  const visible = useMemo(() => {
    return pending.filter((p) => {
      const hasCom = Boolean(p.reviewComments?.trim());
      const okStatus =
        statusFilter === "All" ||
        (statusFilter === "has" && hasCom) ||
        (statusFilter === "none" && !hasCom);
      const okCat = catFilter === "All" || p.category === catFilter;
      return okStatus && okCat;
    });
  }, [pending, statusFilter, catFilter]);

  useEffect(() => {
    if (lightboxIdx !== null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((i) => i !== null && i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setLightboxIdx((i) => i !== null && i < visible.length - 1 ? i + 1 : i);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIdx, visible.length]);

  function getEmptyMessage() {
    if (statusFilter === "has") return "No designs have comments yet.";
    if (statusFilter === "none") return "All designs have been commented on!";
    if (catFilter !== "All") return `All ${catFilter} designs are approved!`;
    return "No designs are currently under review.";
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "1.6rem",
            fontWeight: 500,
            color: "var(--brand)",
            margin: "0 0 0.2rem",
            letterSpacing: "0.01em",
          }}
        >
          Pending Designs
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, fontFamily: "var(--font-inter)" }}>
          {visible.length} / {pending.length} shown — tap a card to preview and add comments.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-inter)", minWidth: 84, letterSpacing: "0.05em", textTransform: "uppercase" }}>Comments:</span>
          {(["All", "has", "none"] as CommentFilter[]).map((f) => {
            const label = f === "All" ? "All" : f === "has" ? "Has Comment" : "No Comment";
            const active = statusFilter === f;
            return (
              <button key={f} onClick={() => setStatusFilter(f)} style={filterTab(active)}>{label}</button>
            );
          })}
        </div>

        {/* Category */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-inter)", minWidth: 84, letterSpacing: "0.05em", textTransform: "uppercase" }}>Category:</span>
          <button onClick={() => setCatFilter("All")} style={filterTab(catFilter === "All")}>All</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} style={filterTab(catFilter === c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            fontFamily: "var(--font-inter)",
          }}
        >
          {getEmptyMessage()}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {visible.map((p, idx) => (
            <PendingCard
              key={p.id}
              product={p}
              onOpen={() => setLightboxIdx(idx)}
              onApprove={async () => {
                try {
                  const res = await fetch("/api/wholesale/approve", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accountId, productId: p.id, action: "approve" }),
                  });
                  if (!res.ok) throw new Error((await res.json()).error);
                  onProductApproved(p.id);
                  toast.success("Approved! Now showing in the Catalog.");
                } catch (err) {
                  toast.error("Error: " + String(err));
                }
              }}
            />
          ))}
        </div>
      )}

      {lightboxIdx !== null && (
        <PendingLightbox
          products={visible}
          index={lightboxIdx}
          onNavigate={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
          accountId={accountId}
          onApproved={(id) => {
            setLightboxIdx(null);
            onProductApproved(id);
            toast.success("Approved! Now showing in the Catalog.");
          }}
          onCommentSaved={(id, full) => {
            onProductsUpdated(
              products.map((p) => p.id === id ? { ...p, reviewComments: full } : p)
            );
          }}
        />
      )}
    </div>
  );
}

function PendingCard({
  product: p,
  onOpen,
  onApprove,
}: {
  product: WholesaleProduct;
  onOpen: () => void;
  onApprove: () => Promise<void>;
}) {
  const [approving, setApproving] = useState(false);
  const latestComment = useMemo(() => {
    const lines = (p.reviewComments ?? "").split("\n").filter((l) => l.trim());
    return lines[lines.length - 1] ?? "";
  }, [p.reviewComments]);

  async function handleApprove(e: React.MouseEvent) {
    e.stopPropagation();
    setApproving(true);
    try {
      await onApprove();
    } finally {
      setApproving(false);
    }
  }

  return (
    <article
      onClick={onOpen}
      style={{
        background: "white",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(107,31,42,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      <div style={{ aspectRatio: "1", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem", overflow: "hidden" }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>No image</span>
        )}
      </div>
      <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>{p.name}</h3>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0, fontFamily: "var(--font-inter)" }}>{p.sku} | {p.category} | {p.size}</p>
        <span
          style={{
            display: "inline-block",
            padding: "1px 7px",
            borderRadius: "999px",
            fontSize: "0.62rem",
            fontWeight: 600,
            background: "var(--bg-card)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            width: "fit-content",
            fontFamily: "var(--font-inter)",
          }}
        >
          Under Review
        </span>
        <p
          style={{
            fontSize: "0.7rem",
            color: latestComment ? "var(--brand)" : "var(--text-muted)",
            fontStyle: latestComment ? "italic" : "normal",
            margin: "0.1rem 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-inter)",
          }}
        >
          {latestComment ? `Latest: ${latestComment}` : "No comments yet"}
        </p>
        <button
          onClick={handleApprove}
          disabled={approving}
          style={{
            marginTop: "0.5rem",
            padding: "0.3rem 0.8rem",
            background: approving ? "var(--border)" : "#1f6326",
            color: "white",
            border: "none",
            borderRadius: "999px",
            fontSize: "0.72rem",
            fontWeight: 600,
            cursor: approving ? "not-allowed" : "pointer",
            fontFamily: "var(--font-inter)",
            width: "fit-content",
          }}
        >
          {approving ? "Approving…" : "Looks Good"}
        </button>
      </div>
    </article>
  );
}

function PendingLightbox({
  products,
  index,
  onNavigate,
  onClose,
  accountId,
  onApproved,
  onCommentSaved,
}: {
  products: WholesaleProduct[];
  index: number;
  onNavigate: (i: number) => void;
  onClose: () => void;
  accountId: string;
  onApproved: (id: string) => void;
  onCommentSaved: (id: string, full: string) => void;
}) {
  const p = products[index];
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const largeImageUrl = p.imageUrl.includes("drive.google.com")
    ? p.imageUrl.replace(/&sz=w\d+/, "&sz=w1600")
    : p.imageUrl;

  const commentLines = useMemo(() => {
    return (p.reviewComments ?? "").split("\n").filter((l) => l.trim());
  }, [p.reviewComments]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [p.reviewComments]);

  async function handleSaveComment() {
    const text = comment.trim();
    if (!text) { toast.error("Please write a comment first"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/wholesale/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, productId: p.id, comment: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { full } = await res.json();
      onCommentSaved(p.id, full);
      setComment("");
      toast.success("Comment saved!");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch("/api/wholesale/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, productId: p.id, action: "approve" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onApproved(p.id);
    } catch (err) {
      toast.error("Error: " + String(err));
      setApproving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pending review: ${p.name}`}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) {
          if (dx < 0 && index < products.length - 1) onNavigate(index + 1);
          else if (dx > 0 && index > 0) onNavigate(index - 1);
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          overflow: "hidden",
          width: "100%",
          maxWidth: 960,
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--brand)",
            padding: "0.875rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "var(--cream)",
              margin: 0,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
          >
            {p.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
              disabled={index === 0}
              aria-label="Previous"
              style={pendNavBtn(index === 0)}
            >‹</button>
            <span style={{ color: "rgba(239,231,214,0.55)", fontSize: "0.72rem", minWidth: 40, textAlign: "center", fontFamily: "var(--font-inter)" }}>
              {index + 1} / {products.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
              disabled={index === products.length - 1}
              aria-label="Next"
              style={pendNavBtn(index === products.length - 1)}
            >›</button>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ color: "rgba(239,231,214,0.7)", fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer", padding: "0 0.25rem", lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          {/* Image */}
          <div style={{ flex: 1, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", overflow: "hidden" }}>
            {largeImageUrl ? (
              <img src={largeImageUrl} alt={p.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 6 }} />
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "var(--font-inter)" }}>No image</span>
            )}
          </div>

          {/* Side panel */}
          <div
            style={{
              width: 310,
              flexShrink: 0,
              padding: "1.25rem",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              overflowY: "auto",
            }}
          >
            {/* Meta */}
            <div>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0, fontFamily: "var(--font-inter)" }}>
                {p.sku} | {p.category} | {p.size}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.66rem",
                  fontWeight: 600,
                  background: "var(--bg-card)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Under Review
              </span>
            </div>

            {/* Comment thread */}
            <div>
              <label style={sideLabel}>Comment History</label>
              <div
                ref={threadRef}
                style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.4rem" }}
              >
                {commentLines.length === 0 ? (
                  <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-inter)" }}>No comments yet.</p>
                ) : (
                  commentLines.map((line, i) => {
                    const m = line.match(/^\[([^\]]+)\]\s*(.*)$/);
                    return (
                      <div
                        key={i}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          padding: "0.4rem 0.65rem",
                        }}
                      >
                        {m && (
                          <p style={{ fontSize: "0.64rem", color: "var(--brand)", fontWeight: 600, margin: "0 0 2px", fontFamily: "var(--font-inter)" }}>
                            {m[1]}
                          </p>
                        )}
                        <p style={{ fontSize: "0.74rem", color: "var(--text)", margin: 0, lineHeight: 1.4, fontFamily: "var(--font-inter)" }}>
                          {m ? m[2] : line}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add comment */}
            <div>
              <label style={sideLabel}>Add a Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write feedback or notes…"
                rows={3}
                style={{
                  width: "100%",
                  marginTop: "0.35rem",
                  padding: "0.5rem 0.65rem",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-inter)",
                  color: "var(--text)",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  background: "white",
                }}
              />
              <button
                onClick={handleSaveComment}
                disabled={saving}
                style={primaryBtn(saving)}
              >
                {saving ? "Saving…" : "Add Comment"}
              </button>
            </div>

            {/* Approve */}
            <button
              onClick={handleApprove}
              disabled={approving}
              style={{
                width: "100%",
                padding: "0.7rem",
                background: approving ? "var(--border)" : "#1f6326",
                color: "white",
                border: "none",
                borderRadius: 7,
                fontSize: "0.86rem",
                fontWeight: 600,
                cursor: approving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-inter)",
              }}
            >
              {approving ? "Approving…" : "Looks Good"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const filterTab = (active: boolean): React.CSSProperties => ({
  padding: "0.35rem 0.65rem",
  borderRadius: 0,
  border: "none",
  borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
  background: "none",
  color: active ? "var(--brand)" : "var(--text-muted)",
  fontSize: "0.76rem",
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  fontFamily: "var(--font-inter)",
  transition: "color 0.15s",
  whiteSpace: "nowrap",
});

const sideLabel: React.CSSProperties = {
  fontSize: "0.68rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  fontFamily: "var(--font-inter)",
};

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  marginTop: "0.5rem",
  padding: "0.55rem",
  background: disabled ? "var(--border)" : "var(--brand)",
  color: disabled ? "var(--text-muted)" : "white",
  border: "none",
  borderRadius: 7,
  fontSize: "0.84rem",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "var(--font-inter)",
});

const pendNavBtn = (disabled: boolean): React.CSSProperties => ({
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: disabled ? "rgba(255,255,255,0.25)" : "rgba(239,231,214,0.8)",
  fontSize: "1.2rem",
  cursor: disabled ? "default" : "pointer",
  borderRadius: "50%",
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flexShrink: 0,
});
