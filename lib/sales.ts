import { createSupabaseService } from "@/lib/supabase/service";

export interface LifetimeSalesResult {
  totalCents: number;
  totalDollars: number;
  orderCount: number;
}

// Sums total_cents across all paid retail orders.
// Used to track the NC sales tax nexus threshold ($1,000).
export async function getTotalLifetimeSales(): Promise<LifetimeSalesResult> {
  const supabase = createSupabaseService();

  const { data, error } = await supabase
    .from("retail_orders")
    .select("total_cents")
    .eq("status", "paid");

  if (error) {
    console.error("[getTotalLifetimeSales] Supabase error:", error);
    return { totalCents: 0, totalDollars: 0, orderCount: 0 };
  }

  const totalCents = (data ?? []).reduce((sum, row) => sum + (row.total_cents ?? 0), 0);
  return {
    totalCents,
    totalDollars: totalCents / 100,
    orderCount: (data ?? []).length,
  };
}

const NC_TAX_WARNING_THRESHOLD_CENTS = 90_000;  // $900
const NC_TAX_REQUIRED_THRESHOLD_CENTS = 100_000; // $1,000

export async function logSalesTaxThresholdWarnings(newOrderTotalCents: number) {
  const { totalCents } = await getTotalLifetimeSales();
  const newTotal = totalCents + newOrderTotalCents;

  if (newTotal >= NC_TAX_REQUIRED_THRESHOLD_CENTS) {
    console.error(
      `🚨 $1K threshold crossed — register for NC sales tax NOW and re-enable Stripe Tax. ` +
      `Lifetime sales: $${(newTotal / 100).toFixed(2)}`
    );
  } else if (newTotal >= NC_TAX_WARNING_THRESHOLD_CENTS) {
    console.warn(
      `⚠️  Approaching $1K threshold — register for NC sales tax once total lifetime sales pass $1,000. ` +
      `Lifetime sales: $${(newTotal / 100).toFixed(2)}`
    );
  }
}
