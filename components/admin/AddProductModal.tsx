"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { Category, ProductWithInventory, ReviewStatus } from "@/lib/admin/types";

const REVIEW_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: "approved",     label: "Approved" },
  { value: "under_review", label: "Under Review" },
  { value: "rejected",     label: "Rejected" },
];

export function AddProductModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (p: ProductWithInventory) => void;
}) {
  const sb = createSupabaseBrowser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [sku, setSku]               = useState("");
  const [name, setName]             = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("under_review");
  const [onHand, setOnHand]         = useState(0);
  const [incoming, setIncoming]     = useState(0);
  const [threshold, setThreshold]   = useState(10);
  const [retailPrice, setRetailPrice] = useState(1.5);
  const [imageUrl, setImageUrl]     = useState("");
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    sb.from("categories").select("id, name").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImageUpload(file: File) {
    if (!sku.trim()) {
      toast.error("Enter a SKU first so the image can be named correctly.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${sku.toLowerCase()}-${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage
        .from("products")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = sb.storage.from("products").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd() {
    if (!sku.trim() || !name.trim()) {
      toast.error("SKU and name are required.");
      return;
    }
    setSaving(true);
    try {
      const newStatus =
        onHand === 0 ? "sold_out" : onHand <= threshold ? "low" : "in_stock";

      const { data: prod, error: pErr } = await sb
        .from("products")
        .insert({
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category_id: categoryId || null,
          review_status: reviewStatus,
          retail_price: retailPrice,
          image_url: imageUrl || null,
          active: true,
          can_buy_individually: true,
        })
        .select("*, categories(name)")
        .single();
      if (pErr) throw pErr;

      const { data: inv, error: iErr } = await sb
        .from("inventory")
        .insert({
          product_id: prod.id,
          on_hand: onHand,
          incoming,
          low_stock_threshold: threshold,
          status: newStatus,
        })
        .select()
        .single();
      if (iErr) throw iErr;

      toast.success("Design added");
      onAdded({ ...prod, inventory: inv } as ProductWithInventory);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to add design");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <p style={modalTitle}>Add Design</p>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.875rem", overflowY: "auto", flex: 1 }}>

          {/* Image */}
          <div>
            <Label>Image</Label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={thumbBox}>
                {imageUrl ? (
                  <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: "0.65rem", color: "#c9b5b5" }}>No img</span>
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
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={outlineBtn}>
                <Upload size={13} />
                {uploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
          </div>

          {/* SKU + Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
            <div>
              <Label>SKU *</Label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="STK-XX"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Name *</Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Design name"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Category + Review */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={inputStyle}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Retail price */}
          <div style={{ maxWidth: 120 }}>
            <Label>Retail Price ($)</Label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={retailPrice}
              onChange={(e) => setRetailPrice(Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          {/* Inventory */}
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
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleAdd} disabled={saving || uploading} style={primaryBtn}>
            {saving ? "Adding…" : "Add Design"}
          </button>
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

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  width: "100%",
  maxWidth: 520,
  maxHeight: "90dvh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
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

const footerStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.625rem",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0.875rem 1.125rem",
  borderTop: "1px solid #e8ddd5",
};

const closeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9a7080",
  padding: 4,
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
  padding: "7px 16px",
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
