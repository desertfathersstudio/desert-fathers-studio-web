"use client";

import { X, Edit2, ExternalLink, Package } from "lucide-react";
import type { ProductWithInventory } from "@/lib/admin/types";
import { InventoryBadge, ReviewBadge, IncomingBadge } from "./StatusBadge";

const COST_PER_STICKER = 0.38; // approximate unit cost

export function ProductDetailDrawer({
  product,
  onClose,
  onEdit,
}: {
  product: ProductWithInventory;
  onClose: () => void;
  onEdit: () => void;
}) {
  const inv = product.inventory;
  const onHand = inv?.on_hand ?? 0;
  const incoming = inv?.incoming ?? 0;
  const threshold = inv?.low_stock_threshold ?? 10;
  const status = inv?.status ?? "sold_out";
  const retail = product.retail_price ?? 1.5;
  const cost = COST_PER_STICKER;
  const margin = retail - cost;
  const marginPct = ((margin / retail) * 100).toFixed(0);
  const inventoryValue = onHand * retail;
  const potentialProfit = onHand * margin;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          background: "rgba(0,0,0,0.35)",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 91,
          width: "min(420px, 100vw)",
          background: "#fff",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: "#fff",
            borderBottom: "1px solid #e8ddd5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.125rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={16} color="#6b1d3b" />
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#2a1a0e" }}>
              Design Details
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid #6b1d3b",
                color: "#6b1d3b",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Edit2 size={12} />
              Edit
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hero image */}
        <div
          style={{
            background: "#f5f0ea",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            flexShrink: 0,
          }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              style={{ maxHeight: 180, maxWidth: "90%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ color: "#c9b5b5", fontSize: "0.8rem" }}>No image</div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Identity */}
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#2a1a0e", letterSpacing: "-0.02em" }}>
              {product.name}
            </h2>
            <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#9a7080" }}>
              {product.sku}
              {product.categories?.name ? ` · ${product.categories.name}` : ""}
              {product.size ? ` · ${product.size}` : ""}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <InventoryBadge status={status} />
              <ReviewBadge status={product.review_status} />
              {incoming > 0 && <IncomingBadge qty={incoming} />}
            </div>
          </div>

          <Divider />

          {/* Inventory numbers */}
          <Section title="Inventory">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <Metric label="On Hand" value={onHand.toString()} accent={onHand === 0 ? "#dc2626" : undefined} />
              <Metric label="Incoming" value={incoming.toString()} accent={incoming > 0 ? "#1d6fb8" : undefined} />
              <Metric label="Low Threshold" value={threshold.toString()} />
            </div>
            {inv?.last_updated && (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.7rem", color: "#c9b5b5" }}>
                Updated {new Date(inv.last_updated).toLocaleDateString()}
              </p>
            )}
          </Section>

          <Divider />

          {/* Pricing & profit */}
          <Section title="Pricing & Profit">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <Metric label="Retail Price" value={`$${retail.toFixed(2)}`} />
              <Metric label="Unit Cost (est.)" value={`$${cost.toFixed(2)}`} />
              <Metric label="Gross Margin" value={`$${margin.toFixed(2)} (${marginPct}%)`} accent="#16a34a" />
              <Metric label="Retail Value in Stock" value={`$${inventoryValue.toFixed(2)}`} />
            </div>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "0.75rem",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#16a34a" }}>
                Potential profit if sold out
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "1.2rem", fontWeight: 800, color: "#15803d", letterSpacing: "-0.02em" }}>
                ${potentialProfit.toFixed(2)}
              </p>
            </div>
          </Section>

          <Divider />

          {/* Review */}
          {product.review_comments && (
            <>
              <Section title="Review Comments">
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#4a3040", lineHeight: 1.5 }}>
                  {product.review_comments}
                </p>
              </Section>
              <Divider />
            </>
          )}

          {/* Links */}
          {product.drive_link && (
            <Section title="Files">
              <a
                href={product.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.82rem",
                  color: "#6b1d3b",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={13} />
                Open in Google Drive
              </a>
            </Section>
          )}

          {/* Dates */}
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#c9b5b5" }}>
            Added {new Date(product.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: "0 0 0.625rem", fontSize: "0.7rem", fontWeight: 700, color: "#6b4050", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Inter, system-ui, sans-serif" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "#9a7080", fontFamily: "Inter, system-ui, sans-serif" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: accent ?? "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#e8ddd5" }} />;
}
