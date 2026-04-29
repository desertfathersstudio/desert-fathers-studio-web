"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { WholesaleProduct, WholesaleCartLine } from "@/types/wholesale";
import {
  unitPriceForSku,
  priceLabelForProduct,
  WS_PRICE_HWP_PACK,
  WS_PRICE_RP_PACK,
  productImageUrl,
  extractDriveFileId,
  driveThumbUrl,
} from "@/lib/wholesale/pricing";

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest first" },
  { value: "oldest",  label: "Oldest first" },
  { value: "az",      label: "Name A–Z" },
  { value: "za",      label: "Name Z–A" },
  { value: "sku",     label: "Product ID" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["value"];

const QTY_OPTIONS = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

interface Props {
  products: WholesaleProduct[];
  onAddToCart: (line: WholesaleCartLine) => void;
  accountId: string;
  hasPendingTab: boolean;
  onProductUnapproved: (id: string) => void;
}

export function CatalogTab({ products, onAddToCart, accountId, hasPendingTab, onProductUnapproved }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [unapproving, setUnapproving] = useState<string | null>(null);
  const [confirmUnapproveId, setConfirmUnapproveId] = useState<string | null>(null);

  const approved = useMemo(
    () => products.filter((p) => p.reviewStatus === "approved" || !p.reviewStatus),
    [products]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    approved.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [approved]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return approved.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      if (activeCategory === "All") return true;
      if (activeCategory === "__new__") return p.isNew;
      return p.category === activeCategory;
    });
  }, [approved, search, activeCategory]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "newest") return arr; // already newest first from API
    if (sort === "oldest") return arr.reverse();
    if (sort === "az")     return arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za")     return arr.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "sku")    return arr.sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true }));
    return arr;
  }, [filtered, sort]);

  const openLightbox = useCallback((idx: number) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") setLightboxIdx((i) => i !== null && i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setLightboxIdx((i) => i !== null && i < sorted.length - 1 ? i + 1 : i);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIdx, sorted.length, closeLightbox]);

  async function handleUnapprove(p: WholesaleProduct) {
    setUnapproving(p.id);
    setConfirmUnapproveId(null);
    try {
      const res = await fetch("/api/wholesale/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, productId: p.id, action: "unapprove" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onProductUnapproved(p.id);
      toast.success("Moved back to Pending review.");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setUnapproving(null);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem 1.25rem" }}>
      {/* Toolbar */}
      <div
        style={{
          position: "sticky",
          top: 99, // below header (~97px)
          zIndex: 20,
          background: "var(--bg)",
          paddingBottom: "0.75rem",
          paddingTop: "0.5rem",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1rem",
        }}
      >
        {/* Search */}
        <input
          type="search"
          placeholder="Search name, SKU, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem 1rem",
            border: "1.5px solid var(--border)",
            borderRadius: "999px",
            background: "white",
            fontSize: "0.85rem",
            outline: "none",
            fontFamily: "var(--font-inter)",
            color: "var(--text)",
            marginBottom: "0.6rem",
          }}
        />

        {/* Category chips + sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          {["All", "__new__", ...categories].map((cat) => {
            const label = cat === "All" ? "All" : cat === "__new__" ? "🆕 New" : cat;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "999px",
                  border: "1.5px solid",
                  borderColor: active ? "var(--brand)" : "var(--border)",
                  background: active ? "var(--brand)" : "white",
                  color: active ? "#fff" : "var(--text)",
                  fontSize: "0.74rem",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "var(--font-inter)",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                padding: "0.25rem 0.5rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-btn)",
                fontSize: "0.74rem",
                background: "white",
                fontFamily: "var(--font-inter)",
                color: "var(--text)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Count */}
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
        {sorted.length} design{sorted.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-card)",
            border: "1.5px dashed var(--border)",
            color: "var(--text-muted)",
            fontSize: "0.88rem",
          }}
        >
          No designs match those filters.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {sorted.map((p, idx) => (
            <CatalogCard
              key={p.id}
              product={p}
              idx={idx}
              onOpen={() => openLightbox(idx)}
              onAddToCart={onAddToCart}
              hasPendingTab={hasPendingTab}
              confirming={confirmUnapproveId === p.id}
              onRequestConfirm={() => setConfirmUnapproveId(p.id)}
              onCancelConfirm={() => setConfirmUnapproveId(null)}
              onUnapprove={() => handleUnapprove(p)}
              unapproving={unapproving === p.id}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <CatalogLightbox
          products={sorted}
          index={lightboxIdx}
          onNavigate={setLightboxIdx}
          onClose={closeLightbox}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CatalogCard({
  product: p,
  idx: _idx,
  onOpen,
  onAddToCart,
  hasPendingTab,
  confirming,
  onRequestConfirm,
  onCancelConfirm,
  onUnapprove,
  unapproving,
}: {
  product: WholesaleProduct;
  idx: number;
  onOpen: () => void;
  onAddToCart: (l: WholesaleCartLine) => void;
  hasPendingTab: boolean;
  confirming: boolean;
  onRequestConfirm: () => void;
  onCancelConfirm: () => void;
  onUnapprove: () => void;
  unapproving: boolean;
}) {
  const priceLabel = priceLabelForProduct({
    sku: p.sku,
    packType: p.packType,
    packOnly: p.packOnly,
  });

  return (
    <article
      onClick={onOpen}
      style={{
        background: "white",
        borderRadius: "var(--radius-card)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          aspectRatio: "1",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1rem" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            No image
          </div>
        )}
        {p.isNew && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              background: "var(--gold)",
              color: "#fff",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 3,
            }}
          >
            New
          </span>
        )}
        {p.packOnly && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "var(--text-muted)",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 600,
              padding: "2px 5px",
              borderRadius: 3,
              opacity: 0.82,
            }}
          >
            Pack only
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "0.65rem 0.75rem 0.75rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        {/* Category pill */}
        <span
          style={{
            display: "inline-block",
            fontSize: "0.62rem",
            fontWeight: 600,
            padding: "1px 7px",
            borderRadius: "999px",
            background: p.categoryBg,
            color: p.categoryText,
            width: "fit-content",
            marginBottom: "0.1rem",
          }}
        >
          {p.category}
        </span>

        <h3
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {p.name}
        </h3>
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.sku}</span>
        {p.size && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.size}</span>}

        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "var(--brand)",
            marginTop: "0.15rem",
          }}
        >
          {priceLabel}
        </span>

        {p.packOnly && (
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 600,
              color: "#856404",
              background: "#fff3cd",
              border: "1px solid #ffe08a",
              borderRadius: "999px",
              padding: "1px 7px",
              width: "fit-content",
              marginTop: "0.15rem",
            }}
          >
            Pack-only sticker
          </span>
        )}
        {p.standalonePackDesign && !p.packOnly && (
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 600,
              color: "#856404",
              background: "#fff3cd",
              border: "1px solid #ffe08a",
              borderRadius: "999px",
              padding: "1px 7px",
              width: "fit-content",
              marginTop: "0.15rem",
            }}
          >
            Can be bought alone or in pack
          </span>
        )}

        {hasPendingTab && (
          confirming ? (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}
            >
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>Move to review?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onUnapprove(); }}
                disabled={unapproving}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem", fontWeight: 700, color: "#fff", background: "#9a3412", border: "none", borderRadius: "999px", cursor: "pointer", fontFamily: "var(--font-inter)" }}
              >
                {unapproving ? "Moving…" : "Yes"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onCancelConfirm(); }}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", background: "white", border: "1px solid var(--border)", borderRadius: "999px", cursor: "pointer", fontFamily: "var(--font-inter)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestConfirm(); }}
              disabled={unapproving}
              style={{
                marginTop: "0.4rem",
                padding: "0.25rem 0.6rem",
                fontSize: "0.66rem",
                fontWeight: 600,
                color: "#9a3412",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "999px",
                cursor: unapproving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-inter)",
                width: "fit-content",
              }}
            >
              Needs Review
            </button>
          )
        )}
      </div>
    </article>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function CatalogLightbox({
  products,
  index,
  onNavigate,
  onClose,
  onAddToCart,
}: {
  products: WholesaleProduct[];
  index: number;
  onNavigate: (i: number) => void;
  onClose: () => void;
  onAddToCart: (l: WholesaleCartLine) => void;
}) {
  const p = products[index];
  const [qty, setQty] = useState(25);
  const [orderMode, setOrderMode] = useState<"single" | "pack">("single");

  const largeImageUrl = useMemo(() => {
    if (p.imageUrl && p.imageUrl.startsWith("http")) {
      if (p.imageUrl.includes("drive.google.com")) {
        return p.imageUrl.replace(/&sz=w\d+/, "&sz=w1600");
      }
      return p.imageUrl;
    }
    const fid = extractDriveFileId(p.imageUrl ?? "");
    if (fid) return driveThumbUrl(fid, "w1600", String(Date.now()));
    return p.imageUrl;
  }, [p]);

  // Touch swipe
  const touchX = useRef<number | null>(null);

  const packPrice = p.packType === "HWP" ? WS_PRICE_HWP_PACK : WS_PRICE_RP_PACK;
  const packId    = p.packType === "HWP" ? "HWP_PACK" : "RP_PACK";
  const packName  = p.packType === "HWP" ? "Holy Week Pack" : "Resurrection Pack";
  const packSize  = p.packType === "HWP" ? "Set of 23" : "Set of 10";

  const unitPrice = orderMode === "pack" ? packPrice : unitPriceForSku(p.sku);
  const lineTotal = (unitPrice * qty).toFixed(2);

  function handleAdd() {
    if (orderMode === "pack" && p.packType) {
      onAddToCart({
        productId: packId,
        designName: packName,
        category: "Pack",
        size: packSize,
        imageUrl: p.imageUrl,
        qty,
        unitPrice: packPrice,
        asap: false,
      });
      toast.success(`${packName} added to cart`);
    } else {
      onAddToCart({
        productId: p.sku,
        designName: p.name,
        category: p.category,
        size: p.size,
        imageUrl: p.imageUrl,
        qty,
        unitPrice: unitPriceForSku(p.sku),
        asap: false,
      });
      toast.success(`${p.name} added to cart`);
    }
    onClose();
  }

  const showPackOption = !!p.packType && !p.isPackProduct;
  const showSingleOption = !p.packOnly;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${p.name} details`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
        background: "rgba(0,0,0,0.82)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Prev / Next arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
        disabled={index === 0}
        aria-label="Previous design"
        style={navBtnStyle(index === 0)}
      >
        <ChevronLeft size={22} />
      </button>

      {/* Modal */}
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
          width: "100%",
          maxWidth: 820,
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.15rem",
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {index + 1} / {products.length}
            </span>
            <button onClick={onClose} aria-label="Close" style={closeBtn}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          {/* Image */}
          <div
            style={{
              flex: 1,
              background: "#fdf9f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              overflow: "hidden",
            }}
          >
            {largeImageUrl ? (
              <img
                src={largeImageUrl}
                alt={p.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 6 }}
              />
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No image available</div>
            )}
          </div>

          {/* Side */}
          <div
            style={{
              width: 270,
              flexShrink: 0,
              padding: "1.25rem",
              borderLeft: "1px solid var(--border)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.66rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: p.categoryBg,
                  color: p.categoryText,
                  width: "fit-content",
                }}
              >
                {p.category}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {p.sku}</span>
              {p.size && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Size: {p.size}</span>}
              {p.isNew && (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gold)" }}>NEW</span>
              )}
            </div>

            {/* Notes */}
            {p.packOnly && (
              <div
                style={{
                  fontSize: "0.76rem",
                  color: "#856404",
                  background: "#fff3cd",
                  border: "1px solid #ffe08a",
                  borderRadius: 8,
                  padding: "0.5rem 0.7rem",
                }}
              >
                This design is pack-only. You can add the full {packName} from here.
              </div>
            )}
            {p.standalonePackDesign && (
              <div
                style={{
                  fontSize: "0.76rem",
                  color: "#856404",
                  background: "#fff3cd",
                  border: "1px solid #ffe08a",
                  borderRadius: 8,
                  padding: "0.5rem 0.7rem",
                }}
              >
                This design can be ordered by itself or as part of the full {packName}.
              </div>
            )}

            {/* Order option */}
            {showPackOption && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={smallLabel}>Order option</label>
                <select
                  value={orderMode}
                  onChange={(e) => setOrderMode(e.target.value as "single" | "pack")}
                  style={inputSm}
                >
                  {showSingleOption && (
                    <option value="single">This sticker — ${unitPriceForSku(p.sku).toFixed(2)}/ea</option>
                  )}
                  <option value="pack">Full {packName} — ${packPrice.toFixed(2)}/set</option>
                </select>
              </div>
            )}

            {/* Qty */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={smallLabel}>Quantity</label>
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))} style={inputSm}>
                {QTY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {/* Total */}
            <div style={{ fontSize: "0.82rem", color: "var(--text)" }}>
              <span style={{ color: "var(--text-muted)" }}>Total: </span>
              <strong style={{ color: "var(--brand)" }}>${lineTotal}</strong>
              {orderMode === "pack" && " (full pack)"}
            </div>

            <button
              onClick={handleAdd}
              disabled={p.packOnly && !showPackOption}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-btn)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
              }}
            >
              + Add to Order
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
        disabled={index === products.length - 1}
        aria-label="Next design"
        style={navBtnStyle(index === products.length - 1)}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: disabled ? "rgba(255,255,255,0.2)" : "white",
  width: 44,
  height: 44,
  borderRadius: "50%",
  cursor: disabled ? "default" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  margin: "0 0.25rem",
});

const closeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  padding: 4,
};

const smallLabel: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputSm: React.CSSProperties = {
  padding: "0.4rem 0.6rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.82rem",
  fontFamily: "var(--font-inter)",
  color: "var(--text)",
  background: "white",
  outline: "none",
  width: "100%",
};
