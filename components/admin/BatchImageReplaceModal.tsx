"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, CheckCircle, AlertCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { adminBatchReplaceImage } from "@/app/admin/inventory/actions";
import type { ProductWithInventory } from "@/lib/admin/types";

type Mode = "live" | "review";
type UploadStatus = "queued" | "uploading" | "done" | "error";

interface Assignment {
  product: ProductWithInventory;
  file: File;
  preview: string;
}

interface Unmatched {
  file: File;
  preview: string;
}

function extractStkNum(filename: string): number | null {
  const m = filename.match(/STK[-_]?(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function matchFilesToProducts(
  files: File[],
  products: ProductWithInventory[],
  existing: Assignment[]
): { matched: Assignment[]; unmatched: Unmatched[] } {
  const matched: Assignment[] = [...existing];
  const unmatched: Unmatched[] = [];

  for (const file of files) {
    const num = extractStkNum(file.name);
    if (num !== null) {
      const product = products.find((p) => {
        const m = p.sku.match(/(\d+)$/);
        return m && parseInt(m[1], 10) === num;
      });
      if (product) {
        const existingIdx = matched.findIndex((a) => a.product.id === product.id);
        const preview = URL.createObjectURL(file);
        if (existingIdx >= 0) {
          URL.revokeObjectURL(matched[existingIdx].preview);
          matched[existingIdx] = { product, file, preview };
        } else {
          matched.push({ product, file, preview });
        }
        continue;
      }
    }
    unmatched.push({ file, preview: URL.createObjectURL(file) });
  }

  return { matched, unmatched };
}

export function BatchImageReplaceModal({
  products,
  onClose,
  onBatchUpdated,
}: {
  products: ProductWithInventory[];
  onClose: () => void;
  onBatchUpdated: (updates: { id: string; imageUrl: string; reviewStatus?: string }[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("live");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unmatched, setUnmatched] = useState<Unmatched[]>([]);
  const [progress, setProgress] = useState<Map<string, UploadStatus>>(new Map());
  const [unmatchedSelections, setUnmatchedSelections] = useState<Map<number, string>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [search, setSearch] = useState("");

  const handleFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      const { matched, unmatched: um } = matchFilesToProducts(images, products, assignments);
      setAssignments(matched);
      setUnmatched((prev) => [...prev, ...um]);
    },
    [products, assignments]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  function removeAssignment(productId: string) {
    setAssignments((prev) => {
      const a = prev.find((x) => x.product.id === productId);
      if (a) URL.revokeObjectURL(a.preview);
      return prev.filter((x) => x.product.id !== productId);
    });
    setProgress((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }

  function removeUnmatched(idx: number) {
    setUnmatched((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
    setUnmatchedSelections((prev) => {
      const next = new Map(prev);
      next.delete(idx);
      return next;
    });
  }

  function assignUnmatched(fileIdx: number, productId: string) {
    const unmatchedFile = unmatched[fileIdx];
    if (!unmatchedFile || !productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setAssignments((prev) => {
      const existingIdx = prev.findIndex((a) => a.product.id === productId);
      const preview = URL.createObjectURL(unmatchedFile.file);
      if (existingIdx >= 0) {
        URL.revokeObjectURL(prev[existingIdx].preview);
        const next = [...prev];
        next[existingIdx] = { product, file: unmatchedFile.file, preview };
        return next;
      }
      return [...prev, { product, file: unmatchedFile.file, preview }];
    });
    setUnmatched((prev) => {
      URL.revokeObjectURL(prev[fileIdx].preview);
      return prev.filter((_, i) => i !== fileIdx);
    });
    setUnmatchedSelections((prev) => {
      const next = new Map(prev);
      next.delete(fileIdx);
      return next;
    });
  }

  async function handleReplace() {
    if (!assignments.length || isRunning) return;
    setIsRunning(true);

    const initialProgress = new Map<string, UploadStatus>();
    assignments.forEach((a) => initialProgress.set(a.product.id, "queued"));
    setProgress(initialProgress);

    const updates: { id: string; imageUrl: string; reviewStatus?: string }[] = [];
    let errorCount = 0;

    for (const { product, file } of assignments) {
      setProgress((prev) => new Map(prev).set(product.id, "uploading"));
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("sku", product.sku.toLowerCase());
        const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");

        await adminBatchReplaceImage(product.id, json.url, mode);

        updates.push({
          id: product.id,
          imageUrl: json.url,
          ...(mode === "review" ? { reviewStatus: "under_review" } : {}),
        });
        setProgress((prev) => new Map(prev).set(product.id, "done"));
      } catch (err: unknown) {
        console.error(err);
        errorCount++;
        setProgress((prev) => new Map(prev).set(product.id, "error"));
      }
    }

    setIsRunning(false);
    setDone(true);

    if (updates.length) onBatchUpdated(updates);

    if (errorCount > 0) {
      toast.error(`${errorCount} image${errorCount > 1 ? "s" : ""} failed to upload`);
    } else {
      toast.success(`${updates.length} image${updates.length !== 1 ? "s" : ""} replaced`);
    }
  }

  const filteredAssignments = assignments.filter(
    (a) =>
      !search ||
      a.product.name.toLowerCase().includes(search.toLowerCase()) ||
      a.product.sku.toLowerCase().includes(search.toLowerCase())
  );

  const assignedProductIds = new Set(assignments.map((a) => a.product.id));
  const availableProducts = products.filter((p) => !assignedProductIds.has(p.id));

  const doneCount = [...progress.values()].filter((v) => v === "done").length;
  const errorItems = assignments.filter((a) => progress.get(a.product.id) === "error");

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
      onClick={(e) => { if (e.target === e.currentTarget && !isRunning) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: 680,
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "1rem 1.25rem 0.875rem", borderBottom: "1px solid #e8ddd5" }}>
          <div>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif" }}>
              Replace Images
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9a7080", fontFamily: "Inter, system-ui, sans-serif" }}>
              Drop replacement images — auto-matched by SKU number in filename
            </p>
          </div>
          <button onClick={onClose} disabled={isRunning} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f0e8e0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b4050", fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>
            After upload:
          </span>
          {(["live", "review"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={isRunning || done}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: mode === m ? "#6b1d3b" : "#e8ddd5",
                background: mode === m ? "#6b1d3b" : "transparent",
                color: mode === m ? "#fff" : "#6b4050",
                fontSize: "0.78rem",
                fontWeight: mode === m ? 600 : 400,
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {m === "live" ? "Push Live" : "Send to Review"}
            </button>
          ))}
          <span style={{ marginLeft: 6, fontSize: "0.72rem", color: "#b09090", fontFamily: "Inter, system-ui, sans-serif" }}>
            {mode === "live"
              ? "Images go live immediately"
              : "Sets status to Under Review"}
          </span>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Drop zone */}
          {!done && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#6b1d3b" : "#d4c4b8"}`,
                borderRadius: 10,
                padding: "1.5rem",
                textAlign: "center",
                cursor: "pointer",
                background: isDragging ? "#fdf5f8" : "#fdf9f4",
                transition: "all 0.15s",
              }}
            >
              <Upload size={22} style={{ color: isDragging ? "#6b1d3b" : "#b09090", margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "0.85rem", color: isDragging ? "#6b1d3b" : "#6b4050", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}>
                Drop images here or click to select
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#b09090", fontFamily: "Inter, system-ui, sans-serif" }}>
                Filenames containing STK-NNN are matched automatically
              </p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileInput} />
            </div>
          )}

          {/* Matched assignments */}
          {assignments.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Queued ({assignments.length})
                </p>
                {assignments.length > 4 && (
                  <input
                    type="text"
                    placeholder="Filter…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: "4px 8px", border: "1px solid #e8ddd5", borderRadius: 6, fontSize: "0.78rem", fontFamily: "Inter, system-ui, sans-serif", outline: "none", color: "#2a1a0e", width: 140 }}
                  />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredAssignments.map(({ product, preview }) => {
                  const status = progress.get(product.id);
                  return (
                    <div
                      key={product.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.625rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor: status === "done" ? "#bbf7d0" : status === "error" ? "#fecaca" : "#e8ddd5",
                        background: status === "done" ? "#f0fdf4" : status === "error" ? "#fef2f2" : "#faf7f4",
                      }}
                    >
                      {/* Current image */}
                      <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f5f0ea", border: "1px solid #e8ddd5", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <ImageIcon size={16} style={{ color: "#c9b5b5" }} />
                        )}
                      </div>

                      <span style={{ fontSize: "0.72rem", color: "#b09090", fontFamily: "Inter, system-ui, sans-serif", flexShrink: 0 }}>→</span>

                      {/* New image preview */}
                      <div style={{ width: 44, height: 44, borderRadius: 6, background: "#fff", border: "1px solid #d4c4b8", flexShrink: 0, overflow: "hidden" }}>
                        <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>

                      {/* Name + SKU */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.name}
                        </p>
                        <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#9a7080", fontFamily: "Inter, system-ui, sans-serif" }}>
                          {product.sku}
                        </p>
                      </div>

                      {/* Status / remove */}
                      {status === "done" ? (
                        <CheckCircle size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                      ) : status === "error" ? (
                        <AlertCircle size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
                      ) : status === "uploading" ? (
                        <span style={{ fontSize: "0.7rem", color: "#6b1d3b", fontFamily: "Inter, system-ui, sans-serif", flexShrink: 0 }}>Uploading…</span>
                      ) : !done ? (
                        <button
                          onClick={() => removeAssignment(product.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#c9b5b5", padding: 2, flexShrink: 0 }}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unmatched files */}
          {unmatched.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 600, color: "#a16207", fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Unmatched ({unmatched.length}) — assign manually
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {unmatched.map((u, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.625rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid #fde68a",
                      background: "#fffbeb",
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: "#fff", border: "1px solid #d4c4b8", flexShrink: 0, overflow: "hidden" }}>
                      <img src={u.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.file.name}
                      </p>
                    </div>
                    <select
                      value={unmatchedSelections.get(idx) ?? ""}
                      onChange={(e) => {
                        const pid = e.target.value;
                        if (pid) {
                          assignUnmatched(idx, pid);
                        } else {
                          setUnmatchedSelections((prev) => new Map(prev).set(idx, ""));
                        }
                      }}
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #d4c4b8",
                        borderRadius: 7,
                        fontSize: "0.78rem",
                        fontFamily: "Inter, system-ui, sans-serif",
                        color: "#2a1a0e",
                        background: "#fff",
                        outline: "none",
                        maxWidth: 200,
                      }}
                    >
                      <option value="">Match to product…</option>
                      {availableProducts
                        .sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true }))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => removeUnmatched(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#c9b5b5", padding: 2, flexShrink: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {assignments.length === 0 && unmatched.length === 0 && !done && (
            <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#b09090", fontFamily: "Inter, system-ui, sans-serif", padding: "1rem 0" }}>
              No images queued yet — drop files above to get started.
            </p>
          )}

          {/* Done summary */}
          {done && (
            <div style={{ padding: "1rem", borderRadius: 8, background: errorItems.length > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${errorItems.length > 0 ? "#fecaca" : "#bbf7d0"}`, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: errorItems.length > 0 ? "#dc2626" : "#16a34a", fontFamily: "Inter, system-ui, sans-serif" }}>
                {doneCount} of {assignments.length} replaced successfully
                {errorItems.length > 0 && ` · ${errorItems.length} failed`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", padding: "0.875rem 1.25rem", borderTop: "1px solid #e8ddd5", justifyContent: "flex-end" }}>
          {done ? (
            <button onClick={onClose} style={primaryBtnStyle}>
              Close
            </button>
          ) : (
            <>
              <button onClick={onClose} disabled={isRunning} style={outlineBtnStyle}>
                Cancel
              </button>
              <button
                onClick={handleReplace}
                disabled={assignments.length === 0 || isRunning}
                style={{
                  ...primaryBtnStyle,
                  opacity: assignments.length === 0 || isRunning ? 0.5 : 1,
                  cursor: assignments.length === 0 || isRunning ? "not-allowed" : "pointer",
                }}
              >
                <Upload size={13} />
                {isRunning
                  ? `Replacing… (${doneCount}/${assignments.length})`
                  : `Replace ${assignments.length > 0 ? assignments.length : ""} Image${assignments.length !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
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

const outlineBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "7px 14px",
  borderRadius: 7,
  background: "transparent",
  color: "#6b4050",
  border: "1px solid #e8ddd5",
  fontSize: "0.82rem",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};
