import type { ProductWithInventory } from "@/lib/admin/types";
import { InventoryBadge, ReviewBadge, IncomingBadge } from "./StatusBadge";

export function InventoryCard({
  product,
  onEdit,
  onDetail,
}: {
  product: ProductWithInventory;
  onEdit: () => void;
  onDetail: () => void;
}) {
  const inv = product.inventory;
  const onHand = inv?.on_hand ?? 0;
  const incoming = inv?.incoming ?? 0;
  const status = inv?.status ?? "sold_out";

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8ddd5",
        borderRadius: 10,
        padding: "0.875rem",
        display: "flex",
        gap: "0.875rem",
        alignItems: "flex-start",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          background: "#f5f0ea",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: "0.6rem", color: "#c9b5b5" }}>No img</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 2px",
            fontWeight: 600,
            fontSize: "0.85rem",
            color: "#2a1a0e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "#9a7080" }}>
          {product.sku}
          {product.categories?.name ? ` · ${product.categories.name}` : ""}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          <InventoryBadge status={status} />
          <ReviewBadge status={product.review_status} />
          {incoming > 0 && <IncomingBadge qty={incoming} />}
        </div>

        <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b4050" }}>
          <span style={{ fontWeight: 700, color: "#2a1a0e" }}>{onHand}</span>
          {" "}on hand
          {incoming > 0 && (
            <span style={{ color: "#1d6fb8" }}> · +{incoming} incoming</span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onDetail}
          style={btnStyle("ghost")}
        >
          Details
        </button>
        <button
          onClick={onEdit}
          style={btnStyle("outline")}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function btnStyle(variant: "ghost" | "outline"): React.CSSProperties {
  return {
    padding: "5px 10px",
    borderRadius: 6,
    border: variant === "outline" ? "1px solid #6b1d3b" : "1px solid #e8ddd5",
    background: variant === "outline" ? "transparent" : "#fdf8f4",
    color: variant === "outline" ? "#6b1d3b" : "#6b4050",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, system-ui, sans-serif",
    whiteSpace: "nowrap" as const,
  };
}
