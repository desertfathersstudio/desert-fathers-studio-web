"use client";

import type { MfgOrder } from "@/lib/admin/types";
import type { MiscExpense } from "./MiscExpensesView";

interface SalesOrder {
  id: string;
  created_at: string;
  total_amount: number | null;
  status: string | null;
}

interface WholesaleOrderRow {
  id: string;
  order_id: string;
  created_at: string;
  grand_total: number | null;
  order_stage: string | null;
  payment_sent: boolean | null;
  payment_received: boolean | null;
}

interface MoneyTrackerProps {
  mfgOrders: Pick<MfgOrder, "id" | "order_id" | "order_date" | "total_cost" | "status">[];
  miscExpenses: MiscExpense[];
  salesOrders: SalesOrder[];
  wholesaleOrders: WholesaleOrderRow[];
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

export function MoneyTrackerView({ mfgOrders, miscExpenses, salesOrders, wholesaleOrders }: MoneyTrackerProps) {
  const printingCost = mfgOrders
    .filter((o) => o.status !== "canceled")
    .reduce((s, o) => s + (o.total_cost ?? 0), 0);

  const miscCost = miscExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSpent = printingCost + miscCost;

  const d2cRevenue = salesOrders
    .filter((o) => o.status !== "canceled" && o.status !== "refunded")
    .reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const wsRevenue = wholesaleOrders
    .filter((o) => o.order_stage !== "Cancelled")
    .reduce((s, o) => s + (o.grand_total ?? 0), 0);

  const pendingToBePaid = wholesaleOrders
    .filter((o) => !o.payment_received && o.order_stage !== "Cancelled")
    .reduce((s, o) => s + (o.grand_total ?? 0), 0);

  const revenue = d2cRevenue + wsRevenue;
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
    const wholesale = wholesaleOrders
      .filter((o) => o.created_at.startsWith(key) && o.order_stage !== "Cancelled")
      .reduce((s, o) => s + (o.grand_total ?? 0), 0);
    const totalRevenue = sales + wholesale;
    return { label, printing, misc, sales, wholesale, totalRevenue, profit: totalRevenue - printing - misc };
  });

  const maxMonthVal = Math.max(...monthlyData.map((m) => Math.max(m.printing + m.misc, m.totalRevenue)), 1);

  return (
    <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <StatCard label="Total Spent"      value={`$${totalSpent.toFixed(2)}`} sub="Printing + expenses" accent="#b45309" />
        <StatCard label="Total Revenue"    value={revenue > 0 ? `$${revenue.toFixed(2)}` : "—"} sub={`D2C $${d2cRevenue.toFixed(2)} + Wholesale $${wsRevenue.toFixed(2)}`} accent="#16a34a" />
        <StatCard label="Profit / Loss"    value={revenue > 0 ? `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}` : "—"} sub={margin != null ? `${margin.toFixed(1)}% margin` : "No sales yet"} accent={profit >= 0 ? "#16a34a" : "#dc2626"} />
        <StatCard label="Wholesale Rev."   value={wsRevenue > 0 ? `$${wsRevenue.toFixed(2)}` : "—"} sub={`${wholesaleOrders.filter(o => o.order_stage !== "Cancelled").length} orders`} accent="#0369a1" />
        <StatCard label="Pending to Be Paid" value={pendingToBePaid > 0 ? `$${pendingToBePaid.toFixed(2)}` : "$0.00"} sub={`${wholesaleOrders.filter(o => !o.payment_received && o.order_stage !== "Cancelled").length} order${wholesaleOrders.filter(o => !o.payment_received && o.order_stage !== "Cancelled").length !== 1 ? "s" : ""} unpaid`} accent={pendingToBePaid > 0 ? "#b45309" : "#9a7080"} />
        <StatCard label="Printing Costs"   value={`$${printingCost.toFixed(2)}`} sub={`${mfgOrders.filter(o => o.status !== "canceled").length} print orders`} />
        <StatCard label="Misc. Expenses"   value={`$${miscCost.toFixed(2)}`} sub={`${miscExpenses.length} entries`} />
      </div>

      {/* Monthly bar chart */}
      <Section title="Monthly Overview (last 6 months)">
        <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, padding: "1.125rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", height: 140 }}>
            {monthlyData.map((m) => {
              const spendH = ((m.printing + m.misc) / maxMonthVal) * 120;
              const revH   = (m.totalRevenue / maxMonthVal) * 120;
              const wsRatio = m.totalRevenue > 0 ? (m.wholesale / m.totalRevenue) * 100 : 0;
              const d2cRatio = m.totalRevenue > 0 ? (m.sales / m.totalRevenue) * 100 : 0;
              return (
                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
                    <div
                      title={`Spent $${(m.printing + m.misc).toFixed(2)}`}
                      style={{ width: "100%", maxWidth: 18, height: Math.max(spendH, 2), background: "#e57373", borderRadius: "3px 3px 0 0" }}
                    />
                    {m.totalRevenue > 0 && (
                      <div
                        title={`Revenue $${m.totalRevenue.toFixed(2)} (D2C $${m.sales.toFixed(2)} + WS $${m.wholesale.toFixed(2)})`}
                        style={{ width: "100%", maxWidth: 18, height: Math.max(revH, 2), borderRadius: "3px 3px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}
                      >
                        <div style={{ height: `${wsRatio}%`, background: "#38bdf8", flexShrink: 0 }} />
                        <div style={{ height: `${d2cRatio}%`, background: "#66bb6a", flexShrink: 0 }} />
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.62rem", color: "#9a7080", textAlign: "center" }}>{m.label}</p>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.625rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: "#9a7080" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#e57373", display: "inline-block" }} /> Spending
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: "#9a7080" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#66bb6a", display: "inline-block" }} /> D2C Revenue
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: "#9a7080" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#38bdf8", display: "inline-block" }} /> Wholesale Revenue
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

      {/* Wholesale Revenue */}
      {wholesaleOrders.length > 0 && (
        <Section title="Wholesale Revenue">
          <div style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 12, overflow: "hidden" }}>
            {wholesaleOrders.filter(o => o.order_stage !== "Cancelled").slice(0, 10).map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderBottom: "1px solid #f0e8e0" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#2a1a0e" }}>{o.order_id}</p>
                  <p style={{ margin: 0, fontSize: "0.68rem", color: "#9a7080" }}>{new Date(o.created_at).toLocaleDateString()} · {o.order_stage}</p>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#0369a1" }}>
                  {o.grand_total != null ? `$${o.grand_total.toFixed(2)}` : "—"}
                </p>
              </div>
            ))}
            <div style={{ padding: "0.625rem 0.875rem", background: "#f0f9ff", borderTop: "1px solid #e8ddd5", display: "flex", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#0369a1" }}>Total Wholesale</p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#0369a1" }}>${wsRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Section>
      )}

      {/* D2C Revenue / Sales */}
      <Section title="D2C Revenue">
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
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>D2C Total</p>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#16a34a" }}>${d2cRevenue.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>
      </Section>

    </div>
  );
}
