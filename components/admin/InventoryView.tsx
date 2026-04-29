"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import type { AdminStats, ProductWithInventory } from "@/lib/admin/types";
import { StatCard } from "./StatCard";
import { InventoryCharts } from "./InventoryCharts";
import { InventoryCard } from "./InventoryCard";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { ProductDetailDrawer } from "./ProductDetailDrawer";

type Filter = "all" | "low" | "sold_out" | "reorder" | "under_review";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "low",          label: "Low Stock" },
  { id: "sold_out",     label: "Sold Out" },
  { id: "reorder",      label: "Needs Reorder" },
  { id: "under_review", label: "Under Review" },
];

export function InventoryView({
  products: initialProducts,
  stats,
}: {
  products: ProductWithInventory[];
  stats: AdminStats;
}) {
  const [products, setProducts] = useState<ProductWithInventory[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductWithInventory | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductWithInventory | null>(null);

  const filtered = useMemo(() => {
    let list = products;

    if (filter === "low")          list = list.filter((p) => p.inventory?.status === "low");
    else if (filter === "sold_out") list = list.filter((p) => p.inventory?.status === "sold_out");
    else if (filter === "reorder")  list = list.filter(
      (p) => (p.inventory?.on_hand ?? 0) <= (p.inventory?.low_stock_threshold ?? 10)
        && p.inventory?.status !== "in_stock"
    );
    else if (filter === "under_review") list = list.filter((p) => p.review_status === "under_review");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categories?.name ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, filter, search]);

  function handleProductUpdated(updated: ProductWithInventory) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditProduct(null);
  }

  function handleProductAdded(added: ProductWithInventory) {
    setProducts((prev) => [...prev, added].sort((a, b) => a.sku.localeCompare(b.sku)));
    setAddOpen(false);
  }

  function handleProductDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setEditProduct(null);
  }

  return (
    <div style={{ padding: "1.25rem", maxWidth: 1280, margin: "0 auto" }}>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <StatCard label="Total Designs"   value={stats.total} />
        <StatCard label="Approved"        value={stats.approved}      accent="#16a34a" />
        <StatCard label="Under Review"    value={stats.pendingReview}  accent="#3949ab" />
        <StatCard label="Low Stock"       value={stats.lowStock}       accent="#a16207" />
        <StatCard label="Sold Out"        value={stats.soldOut}        accent="#dc2626" />
        <StatCard label="Need Reorder"    value={stats.needReorder}    accent="#c2410c" />
        <StatCard label="On Hand Now"     value={stats.onHandNow.toLocaleString()} />
        <StatCard label="Ever Ordered"    value={stats.everOrdered.toLocaleString()} />
        <StatCard label="Total Sold"      value={stats.totalSold.toLocaleString()} />
      </div>

      {/* ── Charts row ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <InventoryCharts products={products} />
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.625rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 0 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9a7080",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search designs, SKU, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              border: "1px solid #e8ddd5",
              borderRadius: 8,
              background: "#fff",
              fontSize: "0.85rem",
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#2a1a0e",
              outline: "none",
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: filter === f.id ? "#6b1d3b" : "#e8ddd5",
                background: filter === f.id ? "#6b1d3b" : "#fff",
                color: filter === f.id ? "#fff" : "#6b4050",
                fontSize: "0.78rem",
                fontWeight: filter === f.id ? 600 : 400,
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
                transition: "all 0.12s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            background: "#6b1d3b",
            color: "#fff",
            border: "none",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
            flexShrink: 0,
          }}
        >
          <Plus size={14} />
          Add Design
        </button>
      </div>

      {/* ── Count ─────────────────────────────────────────────────────── */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "#9a7080",
          marginBottom: "0.75rem",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {filtered.length} design{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Card grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#9a7080",
            fontSize: "0.9rem",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          No designs match your filter.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {filtered.map((product) => (
            <InventoryCard
              key={product.id}
              product={product}
              onEdit={() => setEditProduct(product)}
              onDetail={() => setDetailProduct(product)}
            />
          ))}
        </div>
      )}

      {/* ── Modals / Drawers ──────────────────────────────────────────── */}
      {addOpen && (
        <AddProductModal
          onClose={() => setAddOpen(false)}
          onAdded={handleProductAdded}
        />
      )}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onUpdated={handleProductUpdated}
          onDeleted={handleProductDeleted}
        />
      )}
      {detailProduct && (
        <ProductDetailDrawer
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={() => {
            setEditProduct(detailProduct);
            setDetailProduct(null);
          }}
        />
      )}
    </div>
  );
}
