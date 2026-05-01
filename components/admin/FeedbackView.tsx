"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ProductComment } from "@/types/wholesale";

interface ProductWithComments {
  id: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  category: string;
  comments: ProductComment[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function unresolvedCount(comments: ProductComment[]) {
  return comments.filter((c) => !c.is_resolved && !c.parent_id).length;
}

const C = {
  activeBg:   "#6b1d3b",
  hoverBg:    "rgba(107,29,59,0.1)",
  contentBg:  "#f5f0ea",
  brand:      "#6b1d3b",
  gold:       "#B8893E",
  border:     "#e3d9c8",
  text:       "#2a1a12",
  textMuted:  "#7d6652",
};

export function FeedbackView() {
  const [products, setProducts] = useState<ProductWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductWithComments | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ProductWithComments | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/review-comments");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const diff = unresolvedCount(b.comments) - unresolvedCount(a.comments);
            if (diff !== 0) return diff;
            const la = a.comments[a.comments.length - 1]?.created_at ?? "";
            const lb = b.comments[b.comments.length - 1]?.created_at ?? "";
            return lb.localeCompare(la);
          });
          setProducts(sorted);
          setSelected((prev) =>
            prev
              ? sorted.find((p) => p.id === prev.id) ?? sorted[0] ?? null
              : sorted[0] ?? null
          );
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function selectProduct(p: ProductWithComments) {
    setSelected(p);
    setMobileShowDetail(true);
  }

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: C.textMuted, fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.9rem" }}>
        Loading feedback…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: C.textMuted, fontFamily: "Inter, system-ui, sans-serif" }}>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: C.text, marginBottom: "0.5rem" }}>No feedback yet</p>
        <p style={{ fontSize: "0.85rem", margin: 0 }}>
          Comments added in the wholesale Pending tab will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/*
        Mobile:  show list OR detail (stacked, full-width)
        Desktop: side-by-side panels, fixed height
      */}
      <div className="md:flex md:overflow-hidden" style={{ height: "auto" }}>
        <style>{`
          @media (min-width: 768px) {
            .feedback-container { height: calc(100dvh - 52px); overflow: hidden; }
          }
        `}</style>

        <div className="md:flex md:overflow-hidden feedback-container" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          <div className="md:flex" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "row" }}>

            {/* ── Product list ── */}
            <aside
              style={{
                flexShrink: 0,
                borderRight: `1px solid ${C.border}`,
                overflowY: "auto",
                background: "#faf6ef",
                display: "flex",
                flexDirection: "column",
              }}
              className={mobileShowDetail ? "hidden md:flex md:w-[300px]" : "flex w-full md:w-[300px]"}
            >
              <div style={{ padding: "1rem 1.25rem 0.75rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                  {products.length} design{products.length === 1 ? "" : "s"} with feedback
                </p>
              </div>

              {products.map((product) => {
                const isActive = selected?.id === product.id;
                const unresolved = unresolvedCount(product.comments);
                const latest = product.comments[product.comments.length - 1];
                return (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      width: "100%",
                      padding: "0.875rem 1.25rem",
                      background: isActive ? C.activeBg : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${C.border}`,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s",
                      minHeight: 72,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = C.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        overflow: "hidden",
                        flexShrink: 0,
                        background: isActive ? "rgba(255,255,255,0.15)" : "#ede7d9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isActive ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${C.border}`,
                      }}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <span style={{ fontSize: "0.58rem", color: isActive ? "rgba(255,255,255,0.5)" : C.textMuted }}>
                          No img
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: isActive ? "#fff" : C.text,
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "Inter, system-ui, sans-serif",
                            lineHeight: 1.3,
                          }}
                        >
                          {product.name}
                        </p>
                        {unresolved > 0 && (
                          <span
                            style={{
                              flexShrink: 0,
                              minWidth: 20,
                              height: 20,
                              padding: "0 5px",
                              borderRadius: 10,
                              background: isActive ? "rgba(255,255,255,0.3)" : C.brand,
                              color: "#fff",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          >
                            {unresolved}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "0.76rem",
                          color: isActive ? "rgba(255,255,255,0.65)" : C.textMuted,
                          margin: "3px 0 0",
                          fontFamily: "Inter, system-ui, sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.3,
                        }}
                      >
                        {latest ? latest.body : "No comments"}
                      </p>
                      <p
                        style={{
                          fontSize: "0.68rem",
                          color: isActive ? "rgba(255,255,255,0.4)" : C.textMuted,
                          margin: "2px 0 0",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        {product.comments.length} comment{product.comments.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    {/* Chevron on mobile */}
                    <span
                      className="flex md:hidden"
                      style={{
                        fontSize: "1rem",
                        color: isActive ? "rgba(255,255,255,0.5)" : C.textMuted,
                        flexShrink: 0,
                      }}
                    >
                      ›
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* ── Detail panel ── */}
            {selected ? (
              <div
                className={
                  mobileShowDetail
                    ? "flex flex-col w-full md:flex-1 overflow-hidden"
                    : "hidden md:flex md:flex-col md:flex-1 md:overflow-hidden"
                }
                style={{ minWidth: 0 }}
              >
                <ProductDetail
                  product={selected}
                  onRefresh={fetchData}
                  onBack={() => setMobileShowDetail(false)}
                  onImageExpand={() => setLightboxImage(selected)}
                />
              </div>
            ) : (
              <div
                className="hidden md:flex"
                style={{ flex: 1, alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Select a design to view feedback
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              fontSize: "1.1rem",
              width: 40,
              height: 40,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
          {lightboxImage.imageUrl && (
            <img
              src={lightboxImage.imageUrl.replace(/&sz=w\d+/, "&sz=w1600")}
              alt={lightboxImage.name}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}

function ProductDetail({
  product,
  onRefresh,
  onBack,
  onImageExpand,
}: {
  product: ProductWithComments;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onImageExpand: () => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const topLevel = product.comments.filter((c) => !c.parent_id);
  const threads = topLevel.map((parent) => ({
    parent,
    replies: product.comments.filter((c) => c.parent_id === parent.id),
  }));

  async function handleResolve(comment: ProductComment) {
    const action = comment.is_resolved ? "unresolve" : "resolve";
    setBusy(comment.id + "-resolve");
    try {
      const res = await fetch(`/api/admin/review-comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setBusy(commentId + "-delete");
    try {
      const res = await fetch(`/api/admin/review-comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setBusy(null);
    }
  }

  async function handleReply(parentId: string) {
    const text = replyText.trim();
    if (!text) return;
    setBusy(parentId + "-reply");
    try {
      const res = await fetch("/api/admin/review-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, body: text, parentId }),
      });
      if (!res.ok) throw new Error();
      setReplyText("");
      setReplyingTo(null);
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setBusy(null);
    }
  }

  async function handleNewComment() {
    const text = newComment.trim();
    if (!text) return;
    setBusy("new");
    try {
      const res = await fetch("/api/admin/review-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, body: text }),
      });
      if (!res.ok) throw new Error();
      setNewComment("");
      await onRefresh();
      if (threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
      }
    } catch {
      /* silent */
    } finally {
      setBusy(null);
    }
  }

  const unresolved = unresolvedCount(product.comments);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Product header ── */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        {/* Back button row (mobile only) */}
        <button
          className="flex md:hidden"
          onClick={onBack}
          style={{
            alignItems: "center",
            gap: "0.35rem",
            background: "none",
            border: "none",
            color: C.brand,
            fontSize: "0.82rem",
            fontWeight: 600,
            fontFamily: "Inter, system-ui, sans-serif",
            cursor: "pointer",
            padding: "0 0 0.75rem",
            marginBottom: "0.125rem",
          }}
        >
          ‹ Back to list
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Thumbnail — tap to enlarge */}
          <button
            onClick={onImageExpand}
            title="Tap to enlarge"
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "#ede7d9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${C.border}`,
              cursor: "zoom-in",
              padding: 0,
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: "0.6rem", color: C.textMuted }}>No img</span>
            )}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: C.text,
                margin: "0 0 0.25rem",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.3,
              }}
            >
              {product.name}
            </h2>
            <p
              style={{
                fontSize: "0.75rem",
                color: C.textMuted,
                margin: "0 0 0.5rem",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {product.sku} · {product.category}
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {unresolved > 0 && (
                <span
                  style={{
                    padding: "2px 9px",
                    borderRadius: 999,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    background: "#fef3c7",
                    color: "#92400e",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {unresolved} unresolved
                </span>
              )}
              {product.comments.some((c) => c.is_resolved) && (
                <span
                  style={{
                    padding: "2px 9px",
                    borderRadius: 999,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    background: "#d1fae5",
                    color: "#065f46",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  ✓ Some resolved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Thread ── */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          background: C.contentBg,
        }}
      >
        {threads.length === 0 && (
          <p
            style={{
              color: C.textMuted,
              fontSize: "0.875rem",
              fontFamily: "Inter, system-ui, sans-serif",
              fontStyle: "italic",
            }}
          >
            No comments yet on this design.
          </p>
        )}

        {threads.map(({ parent, replies }) => (
          <div
            key={parent.id}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              marginBottom: "1rem",
              overflow: "hidden",
            }}
          >
            {/* Parent comment */}
            <div style={{ padding: "1rem 1.125rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: C.brand,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {parent.author}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      color: C.textMuted,
                      fontFamily: "Inter, system-ui, sans-serif",
                      marginTop: 1,
                    }}
                  >
                    {formatDate(parent.created_at)}
                  </span>
                </div>
                {parent.is_resolved && (
                  <span
                    style={{
                      fontSize: "0.64rem",
                      fontWeight: 700,
                      color: "#065f46",
                      background: "#d1fae5",
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontFamily: "Inter, system-ui, sans-serif",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    ✓ Resolved
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: "0.9rem",
                  color: C.text,
                  margin: "0 0 1rem",
                  lineHeight: 1.6,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {parent.body}
              </p>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <ActionBtn
                  onClick={() => handleResolve(parent)}
                  loading={busy === parent.id + "-resolve"}
                  variant={parent.is_resolved ? "ghost" : "resolve"}
                >
                  {parent.is_resolved ? "Unresolve" : "✓ Resolve"}
                </ActionBtn>
                <ActionBtn
                  onClick={() => {
                    setReplyingTo(replyingTo === parent.id ? null : parent.id);
                    setReplyText("");
                  }}
                  variant="ghost"
                >
                  ↩ Reply
                </ActionBtn>
                <ActionBtn
                  onClick={() => handleDelete(parent.id)}
                  loading={busy === parent.id + "-delete"}
                  variant="danger"
                >
                  Delete
                </ActionBtn>
              </div>

              {/* Inline reply input */}
              {replyingTo === parent.id && (
                <div
                  style={{
                    marginTop: "0.875rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                    padding: "0.875rem",
                    background: C.contentBg,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <textarea
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply…"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: "0.875rem",
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: C.text,
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                      background: "#fff",
                      lineHeight: 1.5,
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <ActionBtn
                      onClick={() => handleReply(parent.id)}
                      loading={busy === parent.id + "-reply"}
                      variant="primary"
                    >
                      Send Reply
                    </ActionBtn>
                    <ActionBtn onClick={() => setReplyingTo(null)} variant="ghost">
                      Cancel
                    </ActionBtn>
                  </div>
                </div>
              )}
            </div>

            {/* Replies */}
            {replies.map((reply) => (
              <div
                key={reply.id}
                style={{
                  borderTop: `1px solid ${C.border}`,
                  background: "#faf6ef",
                  padding: "0.875rem 1.125rem 0.875rem 1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginBottom: "0.35rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: C.gold,
                      fontWeight: 700,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    ↳
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#8B6914",
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {reply.author}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: C.textMuted,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {formatDate(reply.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: C.text,
                    margin: "0 0 0.625rem",
                    lineHeight: 1.6,
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {reply.body}
                </p>
                <ActionBtn
                  onClick={() => handleDelete(reply.id)}
                  loading={busy === reply.id + "-delete"}
                  variant="danger"
                >
                  Delete
                </ActionBtn>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── New comment footer ── */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderTop: `1px solid ${C.border}`,
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: C.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 0.5rem",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Add admin note
        </p>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a note on this design…"
          rows={3}
          style={{
            width: "100%",
            padding: "0.625rem 0.75rem",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: "0.875rem",
            fontFamily: "Inter, system-ui, sans-serif",
            color: C.text,
            outline: "none",
            resize: "none",
            background: C.contentBg,
            lineHeight: 1.5,
            boxSizing: "border-box",
            marginBottom: "0.625rem",
          }}
        />
        <ActionBtn onClick={handleNewComment} loading={busy === "new"} variant="primary">
          Add Note
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  loading,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger" | "resolve";
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: C.brand, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` },
    danger:  { background: "transparent", color: "#dc2626", border: "1px solid #fca5a5" },
    resolve: { background: "transparent", color: "#065f46", border: "1px solid #6ee7b7" },
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "0.45rem 0.875rem",
        borderRadius: 7,
        fontSize: "0.8rem",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "Inter, system-ui, sans-serif",
        opacity: loading ? 0.6 : 1,
        transition: "opacity 0.12s",
        whiteSpace: "nowrap",
        minHeight: 36,
        ...variantStyles[variant],
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
