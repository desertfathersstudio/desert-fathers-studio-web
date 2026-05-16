"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { X, Upload, Package, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { adminAddPack } from "@/app/admin/inventory/actions";
import type { ProductWithInventory } from "@/lib/admin/types";

const ACCENT_OPTIONS = [
  { label: "Burgundy (brand)",  value: "var(--brand)" },
  { label: "Gold",              value: "var(--gold)" },
  { label: "Forest Green",      value: "#2d6a4f" },
  { label: "Navy Blue",         value: "#1a3a5c" },
  { label: "Slate",             value: "#4a5568" },
];

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  pack_id: string | null;
}

interface StickerUpload {
  tempId: string;
  name: string;
  imageUrl: string;
  imageUpdatedAt: string;
  uploading: boolean;
}

function toTitleCase(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function AddPackModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (p: ProductWithInventory) => void;
}) {
  const coverFileRef   = useRef<HTMLInputElement>(null);
  const stickerFileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState(10);
  const [wholesalePrice, setWholesalePrice] = useState(3);
  const [accentColor, setAccentColor] = useState("var(--brand)");
  const [imageUrl, setImageUrl]       = useState("");
  const [imageUpdatedAt, setImageUpdatedAt] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [packOnly, setPackOnly]       = useState(true);

  const [allProducts, setAllProducts]   = useState<ProductRow[]>([]);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [prodSearch, setProdSearch]     = useState("");
  const [loadingProds, setLoadingProds] = useState(true);

  const [stickerUploads, setStickerUploads] = useState<StickerUpload[]>([]);

  useEffect(() => {
    const sb = createSupabaseBrowser();
    setLoadingProds(true);
    sb.from("products")
      .select("id, sku, name, pack_id")
      .eq("active", true)
      .not("sku", "ilike", "PK-%")
      .order("sku")
      .then(({ data }) => {
        if (data) setAllProducts(data as ProductRow[]);
        setLoadingProds(false);
      });
  }, []);

  const filteredProducts = allProducts.filter((p) => {
    const q = prodSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filteredProducts.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "pack-cover";
      const form = new FormData();
      form.append("file", file);
      form.append("sku", `pack-${slug}`);
      form.append("name", name.trim() || "Pack Back Cover");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setImageUrl(json.url);
      setImageUpdatedAt(new Date().toISOString());
      toast.success("Cover image uploaded");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleStickerFiles(files: FileList) {
    const fileArr = Array.from(files);
    const newUploads: StickerUpload[] = fileArr.map((file) => ({
      tempId: `${Date.now()}-${Math.random()}`,
      name: toTitleCase(file.name),
      imageUrl: "",
      imageUpdatedAt: "",
      uploading: true,
    }));
    setStickerUploads((prev) => [...prev, ...newUploads]);

    await Promise.all(
      fileArr.map(async (file, idx) => {
        const tempId = newUploads[idx].tempId;
        const stickerName = newUploads[idx].name;
        try {
          const form = new FormData();
          form.append("file", file);
          form.append("sku", "stk-upload");
          form.append("name", stickerName);
          const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Upload failed");
          setStickerUploads((prev) =>
            prev.map((u) =>
              u.tempId === tempId
                ? { ...u, imageUrl: json.url, imageUpdatedAt: new Date().toISOString(), uploading: false }
                : u
            )
          );
        } catch (err: unknown) {
          toast.error(`Failed to upload ${file.name}: ${(err as Error).message}`);
          setStickerUploads((prev) => prev.filter((u) => u.tempId !== tempId));
        }
      })
    );
  }

  function updateStickerName(tempId: string, value: string) {
    setStickerUploads((prev) =>
      prev.map((u) => (u.tempId === tempId ? { ...u, name: value } : u))
    );
  }

  function removeStickerUpload(tempId: string) {
    setStickerUploads((prev) => prev.filter((u) => u.tempId !== tempId));
  }

  const completedUploads = stickerUploads.filter((u) => !u.uploading && u.imageUrl);
  const anyUploading = stickerUploads.some((u) => u.uploading);
  const totalStickers = selected.size + completedUploads.length;
  const canSave = totalStickers > 0 && !anyUploading;

  function handleSave() {
    if (!name.trim()) {
      toast.error("Pack name is required");
      return;
    }
    if (!canSave) {
      toast.error("Add at least one sticker (select existing or upload new)");
      return;
    }

    startTransition(async () => {
      try {
        const created = await adminAddPack({
          name: name.trim(),
          description: description.trim(),
          retailPrice,
          wholesalePrice,
          accentColor,
          imageUrl: imageUrl || null,
          imageUpdatedAt: imageUpdatedAt || null,
          constituentProductIds: Array.from(selected),
          packOnly,
          newStickers: completedUploads.map((u) => ({
            name: u.name.trim() || "Untitled Sticker",
            imageUrl: u.imageUrl,
            imageUpdatedAt: u.imageUpdatedAt,
          })),
        });
        const parts: string[] = [];
        if (selected.size > 0) parts.push(`${selected.size} linked`);
        if (completedUploads.length > 0) parts.push(`${completedUploads.length} new (pending review)`);
        toast.success(`"${name.trim()}" created — ${parts.join(", ")}`);
        onAdded(created);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Failed to create pack");
      }
    });
  }

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
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: 680,
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "1rem 1.125rem 0.875rem",
          borderBottom: "1px solid #e8ddd5",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={16} color="#6b1d3b" />
            <div>
              <p style={modalTitle}>New Pack</p>
              <p style={modalSub}>Creates a pack product + links or creates constituent stickers</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1 }}>

          {/* Back cover image */}
          <div>
            <Label>Back Cover Image</Label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={thumbBox}>
                {imageUrl
                  ? <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <span style={{ fontSize: "0.65rem", color: "#c9b5b5" }}>No image</span>
                }
              </div>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
              />
              <button onClick={() => coverFileRef.current?.click()} disabled={coverUploading} style={outlineBtn}>
                <Upload size={13} />
                {coverUploading ? "Uploading…" : "Upload back cover"}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label>Pack Name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advent Pack"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Shown on the packs page below the pack name…"
              style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }}
            />
          </div>

          {/* Pricing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
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
            <div>
              <Label>Wholesale Price ($)</Label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <Label>Accent Color</Label>
            <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={inputStyle}>
              {ACCENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Pack-only toggle */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.625rem 0.75rem",
            background: packOnly ? "#fdf4f4" : "#f9f5f0",
            borderRadius: 8,
            border: `1px solid ${packOnly ? "#e8c8c8" : "#e8ddd5"}`,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#2a1a0e" }}>
                Mark stickers as pack-only
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#9a7080" }}>
                {packOnly
                  ? "All stickers in this pack will not be sold individually (can_buy_individually = false)."
                  : "Stickers can still be purchased individually in the main catalog."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPackOnly((v) => !v)}
              style={{
                width: 38, height: 22, borderRadius: 11, border: "none",
                background: packOnly ? "#6b1d3b" : "#d4c4b8",
                cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s",
              }}
              aria-label="Toggle pack-only"
            >
              <span style={{
                position: "absolute", top: 3, left: packOnly ? 18 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {/* ── Upload new sticker images ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Label>Upload New Sticker Images</Label>
              {stickerUploads.length > 0 && (
                <span style={{ fontSize: "0.72rem", color: "#9a7080" }}>
                  {completedUploads.length} ready{anyUploading ? `, ${stickerUploads.filter(u => u.uploading).length} uploading…` : ""}
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "#9a7080" }}>
              Each image becomes a new inventory item with <strong>under review</strong> status, auto-assigned STK-### SKU, linked to this pack.
            </p>
            <input
              ref={stickerFileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.length) handleStickerFiles(e.target.files); e.target.value = ""; }}
            />
            <button onClick={() => stickerFileRef.current?.click()} style={outlineBtn}>
              <ImagePlus size={13} />
              Choose sticker images…
            </button>

            {/* Uploaded sticker cards */}
            {stickerUploads.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.5rem",
                marginTop: "0.75rem",
              }}>
                {stickerUploads.map((u) => (
                  <div
                    key={u.tempId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.45rem 0.6rem",
                      background: "#fdfaf8",
                      border: "1px solid #e8ddd5",
                      borderRadius: 8,
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 40, height: 40, flexShrink: 0,
                      borderRadius: 6, background: "#f0ece6",
                      border: "1px solid #e8ddd5",
                      overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {u.uploading ? (
                        <Loader2 size={14} color="#9a7080" style={{ animation: "spin 1s linear infinite" }} />
                      ) : u.imageUrl ? (
                        <img src={u.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : null}
                    </div>

                    {/* Editable name */}
                    <input
                      value={u.name}
                      onChange={(e) => updateStickerName(u.tempId, e.target.value)}
                      disabled={u.uploading}
                      placeholder="Sticker name"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "4px 6px",
                        fontSize: "0.78rem",
                        color: "#2a1a0e",
                        border: "1px solid #e8ddd5",
                        borderRadius: 5,
                        background: u.uploading ? "#f5f0ea" : "#fff",
                        outline: "none",
                      }}
                    />

                    {/* Remove */}
                    <button
                      onClick={() => removeStickerUpload(u.tempId)}
                      disabled={u.uploading}
                      style={{
                        flexShrink: 0, background: "none", border: "none",
                        cursor: u.uploading ? "not-allowed" : "pointer",
                        color: "#c9b5b5", padding: 2,
                      }}
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Link existing stickers ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Label>Link Existing Stickers</Label>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: "0.72rem", color: "#9a7080", alignSelf: "center" }}>
                  {selected.size} selected
                </span>
                {filteredProducts.length > 0 && (
                  <>
                    <button onClick={selectAll} style={tinyBtn}>All</button>
                    <button onClick={clearAll} style={tinyBtn}>Clear</button>
                  </>
                )}
              </div>
            </div>
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <div style={{
              border: "1px solid #e8ddd5",
              borderRadius: 8,
              maxHeight: 200,
              overflowY: "auto",
              background: "#fdfaf8",
            }}>
              {loadingProds ? (
                <p style={{ padding: "1rem", fontSize: "0.82rem", color: "#9a7080", margin: 0 }}>
                  Loading stickers…
                </p>
              ) : filteredProducts.length === 0 ? (
                <p style={{ padding: "1rem", fontSize: "0.82rem", color: "#9a7080", margin: 0 }}>
                  {prodSearch ? `No stickers match "${prodSearch}"` : "No stickers available"}
                </p>
              ) : (
                filteredProducts.map((p) => {
                  const isChecked = selected.has(p.id);
                  const alreadyInPack = !!p.pack_id;
                  return (
                    <label
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "0.45rem 0.75rem",
                        cursor: "pointer",
                        borderBottom: "1px solid #f0e8e0",
                        background: isChecked ? "#fdf0f4" : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.id)}
                        style={{ flexShrink: 0, accentColor: "#6b1d3b" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#2a1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.68rem", color: alreadyInPack ? "#a16207" : "#9a7080" }}>
                          {p.sku}{alreadyInPack ? " · already in a pack" : ""}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          gap: "0.625rem",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0.875rem 1.125rem",
          borderTop: "1px solid #e8ddd5",
        }}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={isPending || !canSave}
            style={{ ...primaryBtn, opacity: isPending || !canSave ? 0.6 : 1, cursor: isPending || !canSave ? "not-allowed" : "pointer" }}
          >
            {isPending
              ? "Creating…"
              : totalStickers > 0
              ? `Create Pack (${totalStickers} sticker${totalStickers !== 1 ? "s" : ""})`
              : "Create Pack"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </label>
  );
}

const modalTitle: React.CSSProperties = {
  margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e",
};
const modalSub: React.CSSProperties = {
  margin: "2px 0 0", fontSize: "0.75rem", color: "#9a7080",
};
const closeBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4, flexShrink: 0,
};
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box" as const, padding: "7px 10px",
  border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem",
  color: "#2a1a0e", background: "#fff", outline: "none",
};
const thumbBox: React.CSSProperties = {
  width: 64, height: 64, borderRadius: 8, background: "#f5f0ea",
  border: "1px solid #e8ddd5", flexShrink: 0, overflow: "hidden",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
  borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none",
  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
};
const outlineBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
  borderRadius: 7, background: "transparent", color: "#6b4050",
  border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500,
  cursor: "pointer",
};
const tinyBtn: React.CSSProperties = {
  padding: "2px 8px", borderRadius: 4, border: "1px solid #e8ddd5",
  background: "transparent", color: "#6b4050", fontSize: "0.7rem",
  cursor: "pointer",
};
