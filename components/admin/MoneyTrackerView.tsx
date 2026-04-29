"use client";

import type { MfgOrder } from "@/lib/admin/types";
import type { MiscExpense } from "./MiscExpensesView";

interface SalesOrder {
  id: string;
  created_at: string;
  total_amount: number | null;
  status: string | null;
}

interface MoneyTrackerProps {
  mfgOrders: Pick<MfgOrder, "id" | "order_id" | "order_date" | "total_cost" | "status">[];
  miscExpenses: MiscExpense[];
  salesOrders: SalesOrder[];
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, padding: "1rem 1.125rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: "#9a7080", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter, system-ui, sans-serif" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: accent ?? "#2a1a0e", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "Inter, system-ui, sans-serif" }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#9a7080", fontFamily: "Inter, system-ui, sans-serif" }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", fontWeight: 700, color: "#6b4050", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Inter, system-ui, sans-serif" }}>{title}</h2>
      {children}
    </div>
  );
}

export function MoneyTrackerView({ mfgOrders, miscExpenses, salesOrders }: MoneyTrackerProps) {
  const printingCost = mfgOrders
    .filter((o) => o.status !== "canceled")
    .reduce((s, o) => s + (o.total_cost ?? 0), 0);

  const miscCost = miscExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSpent = printingCost + miscCost;

  const revenue = salesOrders
    .filter((o) => o.status !== "canceled" && o.status !== "refunded")
    .reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const profit = revenue - totalSpent;
  const margin = revenue > 0 ? (profit / revenue) * 100 : null;

  // Monthly breakdown (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
    };
  });

  const monthlyData = months.map(({ key, label }) => {
    const printing = mfgOrders
      .filter((o) => o.order_date?.startsWith(key) && o.status !== "canceled")
      .reduce((s, o) => s + (o.total_cost ?? 0), 0);
    const misc = miscExpenses
      .filter((e) => e.date.startsWith(key))
      .reduce((s, e) => s + e.amount, 0);
    const sales = salesOrders
      .filter((o) => o.created_at.startsWith(key) && o.status !== "canceled" && o.status !== "refunded")
      .reduce((s, o) => s + (o.total_amount ?? 0), 0);
    return { label, printing, misc, sales, profit: sales - printing - misc };
  });

  const maxMonthVal = Math.max(...monthlyData.map((m) => Math.max(m.printing + m.misc, m.sales)), 1);

  return (
    <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <StatCard label="Total Spent"    value={`$${totalSpent.toFixed(2)}`} sub={`Printing + expenses`} accent="#b45309" />
        <StatCard label="Revenue"        value={revenue > 0 ? `$${revenue.toFixed(2)}` : "—"} sub="From customer sales" accent="#16a34a" />
        <StatCard label="Profit / Loss"  value={revenue > 0 ? `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}` : "—"} sub={margin != null ? `${margin.toFixed(1)}% margin` : "No sales yet"} accent={profit >= 0 ? "#16a34a" : "#dc2626"} />
        <StatCard label="Printing Costs" value={`$${printingCost.toFixed(2)}`} sub={`${mfgOrders.filter(o => o.status !== "canceled").length} orders`} />
        <StatCard label="Misc. Expenses" value={`$${miscCost.toFixed(2)}`} sub={`${miscExpenses.length} entries`} />
      </div>

      {/* Monthly bar chart */}
      <Section title="Monthly Overview (last 6 months)">
        <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, padding: "1.125rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", height: 140 }}>
            {monthlyData.map((m) => {
              const spendHeight = ((m.printing + m.misc) / maxMonthVal) * 120;
              const salesHeight = (m.sales / maxMonthVal) * 120;
              return (
                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
                    <div
                      title={`Spent $${(m.printing + m.misc).toFixed(2)}`}
                      style={{
                        width: "100%", maxWidth: 18,
                        height: spendHeight || 2,
                        background: "#e57373",
                        borderRadius: "3px 3px 0 0",
                        minHeight: 2,
                      }}
                    />
                    {m.sales > 0 && (
                      <div
                        title={`Revenue $${m.sales.toFixed(2)}`}
                        style={{
                          width: "100%", maxWidth: 18,
                          height: salesHeight || 2,
                          background: "#66bb6a",
                          borderRadius: "3px 3px 0 0",
                          minHeight: 2,
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.62rem", color: "#9a7080", textAlign: "center" }}>{m.label}</p>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.625rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: "#9a7080" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#e57373", display: "inline-block" }} /> Spending
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: "#9a7080" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#66bb6a", display: "inline-block" }} /> Revenue
            </span>
          </div>
        </div>
      </Section>

      {/* Spending breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>

        {/* Print orders */}
        <Section title="Print Orders">
          <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, overflow: "hidden" }}>
            {mfgOrders.filter(o => o.status !== "canceled").length === 0 ? (
              <p style={{ margin: 0, padding: "1rem", color: "#9a7080", fontSize: "0.82rem", textAlign: "center" }}>No orders yet.</p>
            ) : (
              mfgOrders.filter(o => o.status !== "canceled").slice(0, 8).map((o) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderBottom: "1px solid #f0e8e0" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#2a1a0e" }}>{o.order_id}</p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "#9a7080" }}>{o.order_date} · {o.status}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#b45309" }}>
                    {o.total_cost != null ? `$${o.total_cost.toFixed(2)}` : "—"}
                  </p>
                </div>
              ))
            )}
            <div style={{ padding: "0.625rem 0.875rem", background: "#fdf8f4", borderTop: "1px solid #e8ddd5", display: "flex", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#6b4050" }}>Total</p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#b45309" }}>${printingCost.toFixed(2)}</p>
            </div>
          </div>
        </Section>

        {/* Misc expenses */}
        <Section title="Misc. Expenses">
          <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, overflow: "hidden" }}>
            {miscExpenses.length === 0 ? (
              <p style={{ margin: 0, padding: "1rem", color: "#9a7080", fontSize: "0.82rem", textAlign: "center" }}>No expenses logged.</p>
            ) : (
              miscExpenses.slice(0, 8).map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderBottom: "1px solid #f0e8e0" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#2a1a0e" }}>{e.description}</p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "#9a7080" }}>{e.date} · {e.category}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#b45309" }}>${e.amount.toFixed(2)}</p>
                </div>
              ))
            )}
            <div style={{ padding: "0.625rem 0.875rem", background: "#fdf8f4", borderTop: "1px solid #e8ddd5", display: "flex", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#6b4050" }}>Total</p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#b45309" }}>${miscCost.toFixed(2)}</p>
            </div>
          </div>
        </Section>
      </div>

      {/* Revenue / Sales — placeholder if no sales yet */}
      <Section title="Revenue">
        <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, overflow: "hidden" }}>
          {salesOrders.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 600, color: "#2a1a0e" }}>No sales yet</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#9a7080" }}>Sales orders will appear here once customers start purchasing.</p>
            </div>
          ) : (
            <>
              {salesOrders.slice(0, 10).map((o) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderBottom: "1px solid #f0e8e0" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#2a1a0e" }}>{o.id.slice(0, 8)}…</p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "#9a7080" }}>{new Date(o.created_at).toLocaleDateString()} · {o.status}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#16a34a" }}>
                    {o.total_amount != null ? `$${o.total_amount.toFixed(2)}` : "—"}
                  </p>
                </div>
              ))}
              <div style={{ padding: "0.625rem 0.875rem", background: "#f0fdf4", borderTop: "1px solid #e8ddd5", display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>Total Revenue</p>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#16a34a" }}>${revenue.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>
      </Section>

    </div>
  );
}
