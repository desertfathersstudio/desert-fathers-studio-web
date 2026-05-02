"use client";

import { useState, useRef, useTransition } from "react";
import { X, Upload, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { adminUpdateProduct, adminArchiveProduct } from "@/app/admin/inventory/actions";
import type { InventoryStatus, ProductWithInventory, ReviewStatus } from "@/lib/admin/types";

const REVIEW_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: "approved",     label: "Approved" },
  { value: "under_review", label: "Under Review" },
  { value: "rejected",     label: "Rejected" },
];

export function EditProductModal({
  product,
  onClose,
  onUpdated,
  onDeleted,
}: {
  product: ProductWithInventory;
  onClose: () => void;
  onUpdated: (p: ProductWithInventory) => void;
  onDeleted: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName]                   = useState(product.name);
  const [reviewStatus, setReviewStatus]   = useState<ReviewStatus>(product.review_status);
  const [reviewComments, setReviewComments] = useState(product.review_comments ?? "");
  const [onHand, setOnHand]               = useState(product.inventory?.on_hand ?? 0);
  const [incoming, setIncoming]           = useState(product.inventory?.incoming ?? 0);
  const [threshold, setThreshold]         = useState(product.inventory?.low_stock_threshold ?? 10);
  const [imageUrl, setImageUrl]           = useState(product.image_url ?? "");
  const [uploading, setUploading]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sku", product.sku);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setImageUrl(json.url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const newStatus: InventoryStatus =
          onHand === 0 ? "sold_out" : onHand <= threshold ? "low" : "in_stock";

        await adminUpdateProduct(product.id, {
          name,
          reviewStatus,
          reviewComments: reviewComments || null,
          imageUrl: imageUrl || null,
          onHand,
          incoming,
          threshold,
          hasInventory: !!product.inventory,
        });

        const updated: ProductWithInventory = {
          ...product,
          name,
          review_status: reviewStatus,
          review_comments: reviewComments || null,
          image_url: imageUrl || null,
          inventory: {
            ...(product.inventory ?? { id: "", product_id: product.id, last_updated: null }),
            on_hand: onHand,
            incoming,
            low_stock_threshold: threshold,
            status: newStatus,
          },
        };

        toast.success("Saved");
        onUpdated(updated);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Save failed");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await adminArchiveProduct(product.id);
        toast.success("Design archived");
        onDeleted(product.id);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Delete failed");
      }
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <p style={modalTitle}>Edit Design</p>
            <p style={modalSub}>{product.sku}</p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1 }}>

          {/* Image */}
          <div>
            <Label>Image</Label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={thumbBox}>
                {imageUrl ? (
                  <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: "0.65rem", color: "#c9b5b5" }}>No image</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={outlineBtn}
              >
                <Upload size={13} />
                {uploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label>Name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Review status */}
          <div>
            <Label>Review Status</Label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
              style={inputStyle}
            >
              {REVIEW_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Review comments */}
          <div>
            <Label>Review Comments</Label>
            <textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }}
            />
          </div>

          {/* Inventory numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>On Hand</Label>
              <input
                type="number"
                min={0}
                value={onHand}
                onChange={(e) => setOnHand(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Incoming</Label>
              <input
                type="number"
                min={0}
                value={incoming}
                onChange={(e) => setIncoming(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Low Threshold</Label>
              <input
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Derived status preview */}
          <p style={{ fontSize: "0.75rem", color: "#9a7080", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
            Status will be:{" "}
            <strong style={{ color: onHand === 0 ? "#dc2626" : onHand <= threshold ? "#a16207" : "#16a34a" }}>
              {onHand === 0 ? "Sold Out" : onHand <= threshold ? "Low" : "In Stock"}
            </strong>
          </p>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
              <AlertTriangle size={14} color="#dc2626" />
              <span style={{ fontSize: "0.8rem", color: "#dc2626", fontFamily: "Inter, system-ui, sans-serif" }}>
                Archive this design?
              </span>
              <button onClick={handleDelete} disabled={isPending} style={{ ...primaryBtn, background: "#dc2626", marginLeft: 4 }}>
                Yes, archive
              </button>
              <button onClick={() => setConfirmDelete(false)} style={outlineBtn}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ ...outlineBtn, borderColor: "#ef4444", color: "#dc2626", marginRight: "auto" }}
              >
                <Trash2 size={13} />
                Archive
              </button>
              <button onClick={onClose} style={outlineBtn}>Cancel</button>
              <button onClick={handleSave} disabled={isPending} style={primaryBtn}>
                {isPending ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </label>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  width: "100%",
  maxWidth: 480,
  maxHeight: "90dvh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "1rem 1.125rem 0.875rem",
  borderBottom: "1px solid #e8ddd5",
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 700,
  color: "#2a1a0e",
  fontFamily: "Inter, system-ui, sans-serif",
};

const modalSub: React.CSSProperties = {
  margin: "2px 0 0",
  fontSize: "0.75rem",
  color: "#9a7080",
  fontFamily: "Inter, system-ui, sans-serif",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.625rem",
  alignItems: "center",
  padding: "0.875rem 1.125rem",
  borderTop: "1px solid #e8ddd5",
};

const closeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9a7080",
  padding: 4,
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "7px 10px",
  border: "1px solid #e8ddd5",
  borderRadius: 7,
  fontSize: "0.85rem",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "#2a1a0e",
  background: "#fff",
  outline: "none",
};

const thumbBox: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 8,
  background: "#f5f0ea",
  border: "1px solid #e8ddd5",
  flexShrink: 0,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const primaryBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "7px 14px",
  borderRadius: 7,
  background: "#6b1d3b",
  color: "#fff",
  border: "none",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};

const outlineBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "7px 12px",
  borderRadius: 7,
  background: "transparent",
  color: "#6b4050",
  border: "1px solid #e8ddd5",
  fontSize: "0.82rem",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};
