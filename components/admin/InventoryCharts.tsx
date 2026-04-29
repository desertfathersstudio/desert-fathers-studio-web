"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import type { ProductWithInventory } from "@/lib/admin/types";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8ddd5",
  borderRadius: 10,
  padding: "1.125rem",
};

const cardTitle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#6b4050",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "1rem",
  fontFamily: "Inter, system-ui, sans-serif",
};

const DONUT_COLORS = {
  in_stock: "#22c55e",
  low:      "#eab308",
  sold_out: "#ef4444",
};

export function InventoryCharts({ products }: { products: ProductWithInventory[] }) {
  // ── Donut: stock health ──
  const stockHealth = [
    { name: "In Stock",  value: products.filter((p) => p.inventory?.status === "in_stock").length, color: DONUT_COLORS.in_stock },
    { name: "Low",       value: products.filter((p) => p.inventory?.status === "low").length,       color: DONUT_COLORS.low },
    { name: "Sold Out",  value: products.filter((p) => p.inventory?.status === "sold_out").length,  color: DONUT_COLORS.sold_out },
  ].filter((d) => d.value > 0);

  // ── Bar: by category ──
  const catMap = new Map<string, number>();
  for (const p of products) {
    const cat = p.categories?.name ?? "Other";
    catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
  }
  const byCategory = [...catMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ── Bar: review pipeline ──
  const reviewMap = new Map<string, number>();
  for (const p of products) {
    const r = p.review_status ?? "other";
    reviewMap.set(r, (reviewMap.get(r) ?? 0) + 1);
  }
  const byReview = [
    { name: "Approved",     count: reviewMap.get("approved") ?? 0,     color: "#22c55e" },
    { name: "Under Review", count: reviewMap.get("under_review") ?? 0, color: "#3949ab" },
    { name: "Rejected",     count: reviewMap.get("rejected") ?? 0,     color: "#ef4444" },
  ].filter((d) => d.count > 0);

  // ── Reorder needed ──
  const reorderNeeded = products.filter(
    (p) => (p.inventory?.on_hand ?? 0) <= (p.inventory?.low_stock_threshold ?? 10)
      && (p.inventory?.status !== "in_stock")
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1rem",
      }}
    >
      {/* Donut */}
      <div style={cardStyle}>
        <p style={cardTitle}>Stock Health</p>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={stockHealth}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {stockHealth.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: "0.78rem", fontFamily: "Inter, system-ui, sans-serif" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stockHealth.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.8rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ color: "#6b4050" }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: "#2a1a0e", marginLeft: "auto" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By category */}
      <div style={cardStyle}>
        <p style={cardTitle}>Designs by Category</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byCategory} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Inter, system-ui, sans-serif" }} />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 10, fontFamily: "Inter, system-ui, sans-serif" }}
            />
            <Tooltip contentStyle={{ fontSize: "0.78rem", fontFamily: "Inter, system-ui, sans-serif" }} />
            <Bar dataKey="count" fill="#6b1d3b" radius={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Review pipeline */}
      <div style={cardStyle}>
        <p style={cardTitle}>Review Pipeline</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={byReview} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Inter, system-ui, sans-serif" }} />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 10, fontFamily: "Inter, system-ui, sans-serif" }}
            />
            <Tooltip contentStyle={{ fontSize: "0.78rem", fontFamily: "Inter, system-ui, sans-serif" }} />
            <Bar dataKey="count" radius={3}>
              {byReview.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reorder needed */}
      <div style={cardStyle}>
        <p style={cardTitle}>Needs Reorder ({reorderNeeded.length})</p>
        {reorderNeeded.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#22c55e", fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif" }}>
            ✅ No reorders needed
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
            {reorderNeeded.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0.4rem 0.5rem",
                  borderRadius: 7,
                  background: "#fdf8f4",
                }}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 5, background: "#fff", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 5, background: "#e8ddd5", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#9a7080", fontFamily: "Inter, system-ui, sans-serif" }}>
                    {p.inventory?.on_hand ?? 0} on hand
                  </p>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ef4444", fontFamily: "Inter, system-ui, sans-serif", flexShrink: 0 }}>
                  {p.inventory?.status === "sold_out" ? "Sold Out" : "Low"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
