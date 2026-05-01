"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { WholesaleProduct } from "@/types/wholesale";
import type { ProductComment } from "@/types/wholesale";

interface Props {
  products: WholesaleProduct[];
  onProductApproved: (id: string) => void;
  onProductsUpdated: (updatedProducts: WholesaleProduct[]) => void;
  accountId: string;
}

type CommentFilter = "All" | "has" | "none";

interface BadgeData {
  adminCommentCount: number;
  hasResolution: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function PendingTab({ products, onProductApproved, onProductsUpdated, accountId }: Props) {
  const [statusFilter, setStatusFilter] = useState<CommentFilter>("All");
  const [catFilter, setCatFilter] = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [commentBadges, setCommentBadges] = useState<Record<string, BadgeData>>({});

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
    fetch(`/api/wholesale/comment-badges?accountId=${accountId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, BadgeData> = {};
        for (const b of data) {
          map[b.productId] = { adminCommentCount: b.adminCommentCount, hasResolution: b.hasResolution };
        }
        setCommentBadges(map);
      })
      .catch(() => {});
  }, [accountId]);

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
              badge={commentBadges[p.id]}
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
  badge,
  onOpen,
  onApprove,
}: {
  product: WholesaleProduct;
  badge?: BadgeData;
  onOpen: () => void;
  onApprove: () => Promise<void>;
}) {
  const [approving, setApproving] = useState(false);
  const latestComment = useMemo(() => {
    const lines = (p.reviewComments ?? "").split("\n").filter((l) => l.trim());
    return lines[lines.length - 1] ?? "";
  }, [p.reviewComments]);

  const hasAdminReply = badge && badge.adminCommentCount > 0;
  const isResolved = badge && badge.hasResolution;

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
      data-ws-card
      onClick={onOpen}
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ aspectRatio: "1", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem", overflow: "hidden", position: "relative" }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>No image</span>
        )}
        {/* Badge indicators */}
        {(hasAdminReply || isResolved) && (
          <div style={{ position: "absolute", top: 6, right: 6, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            {isResolved ? (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "2px 7px",
                borderRadius: 999,
                fontSize: "0.6rem",
                fontWeight: 700,
                background: "#d1fae5",
                color: "#065f46",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.03em",
              }}>
                ✓ Resolved
              </span>
            ) : hasAdminReply ? (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "2px 7px",
                borderRadius: 999,
                fontSize: "0.6rem",
                fontWeight: 700,
                background: "#fef3c7",
                color: "#92400e",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.03em",
              }}>
                ↩ Admin replied
              </span>
            ) : null}
          </div>
        )}
      </div>
      <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", margin: 0, textWrap: "balance" } as React.CSSProperties}>{p.name}</h3>
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
  const [structuredComments, setStructuredComments] = useState<ProductComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const largeImageUrl = p.imageUrl.includes("drive.google.com")
    ? p.imageUrl.replace(/&sz=w\d+/, "&sz=w1600")
    : p.imageUrl;

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/wholesale/product-comments?accountId=${accountId}&productId=${p.id}`);
      if (res.ok) {
        const data = await res.json();
        setStructuredComments(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently fail — legacy text still shows on card
    } finally {
      setLoadingComments(false);
    }
  }, [accountId, p.id]);

  useEffect(() => {
    setStructuredComments([]);
    fetchComments();
  }, [p.id, fetchComments]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [structuredComments]);

  // Build threaded view: top-level comments + their replies grouped
  const threads = useMemo(() => {
    const topLevel = structuredComments.filter((c) => !c.parent_id);
    return topLevel.map((parent) => ({
      parent,
      replies: structuredComments.filter((c) => c.parent_id === parent.id),
    }));
  }, [structuredComments]);

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
      await fetchComments();
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
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderLeft: "1px solid var(--border)",
            }}
          >
            {/* Meta */}
            <div style={{ padding: "1rem 1.25rem 0.75rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: "0 0 0.3rem", fontFamily: "var(--font-inter)" }}>
                {p.sku} · {p.category} · {p.size}
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.63rem",
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

            {/* Thread */}
            <div
              ref={threadRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.875rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              <p style={sideLabel}>
                {threads.length === 0 ? "No comments yet" : `${threads.length} comment${threads.length === 1 ? "" : "s"}`}
              </p>

              {loadingComments && threads.length === 0 && (
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-inter)", margin: "0.5rem 0 0" }}>
                  Loading…
                </p>
              )}

              {threads.map(({ parent, replies }, ti) => {
                const resolved = parent.is_resolved || replies.some((r) => r.is_resolved);
                return (
                  <div
                    key={parent.id}
                    style={{
                      paddingTop: ti === 0 ? "0.5rem" : "0.875rem",
                      paddingBottom: "0.875rem",
                      borderBottom: ti < threads.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {/* Parent comment */}
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "var(--brand)",
                          fontFamily: "var(--font-inter)",
                        }}>
                          {parent.author}
                        </span>
                        <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontFamily: "var(--font-inter)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {formatDate(parent.created_at)}
                        </span>
                      </div>
                      <p style={{
                        fontSize: "0.82rem",
                        color: "var(--text)",
                        margin: 0,
                        lineHeight: 1.5,
                        fontFamily: "var(--font-inter)",
                      }}>
                        {parent.body}
                      </p>
                      {resolved && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          marginTop: 6,
                          padding: "1px 7px",
                          borderRadius: 999,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          background: "#d1fae5",
                          color: "#065f46",
                          fontFamily: "var(--font-inter)",
                        }}>
                          ✓ Resolved
                        </span>
                      )}
                    </div>

                    {/* Replies */}
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        style={{
                          marginTop: "0.625rem",
                          marginLeft: "0.875rem",
                          paddingLeft: "0.875rem",
                          borderLeft: "2px solid var(--gold)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.2rem" }}>
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color: "#8B6914",
                            fontFamily: "var(--font-inter)",
                          }}>
                            {reply.author}
                          </span>
                          <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "var(--font-inter)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p style={{
                          fontSize: "0.79rem",
                          color: "var(--text)",
                          margin: 0,
                          lineHeight: 1.5,
                          fontFamily: "var(--font-inter)",
                        }}>
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Add comment + Approve */}
            <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--border)", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or note…"
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.65rem",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-inter)",
                  color: "var(--text)",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  background: "var(--bg-card)",
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={handleSaveComment}
                disabled={saving}
                style={primaryBtn(saving)}
              >
                {saving ? "Saving…" : "Add Comment"}
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  background: approving ? "var(--border)" : "#1f6326",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: approving ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {approving ? "Approving…" : "Looks Good — Approve"}
              </button>
            </div>
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
  transition: "color 150ms ease-out",
  whiteSpace: "nowrap",
});

const sideLabel: React.CSSProperties = {
  fontSize: "0.66rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  fontFamily: "var(--font-inter)",
  margin: 0,
};

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "0.55rem",
  background: disabled ? "var(--border)" : "var(--brand)",
  color: disabled ? "var(--text-muted)" : "white",
  border: "none",
  borderRadius: 8,
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
