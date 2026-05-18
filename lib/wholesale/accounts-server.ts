// SERVER-ONLY — never import this in a client component.
// All account lookups go through the DB (wholesale_accounts table).
// PINs live only in the DB and never reach the client bundle.

import type { NextRequest } from "next/server";
import { createSupabaseService } from "@/lib/supabase/service";
import type { WholesaleAccountConfig } from "@/config/wholesale-accounts";
import { getSessionAccountId } from "@/lib/wholesale/validate-session";

interface AccountRow {
  id: string;
  account_id: string;
  display_name: string;
  notify_email: string;
  pin: string;
  has_pending_tab: boolean;
  can_edit_fulfillment: boolean;
  contact_names: string[];
  price_single: number | null;
  price_rp_pack: number | null;
  price_hwp_pack: number | null;
  currency_symbol: string;
  min_qty: number | null;
  qty_options: number[] | null;
  pack_prices: Record<string, number> | null;
  active: boolean;
}

function rowToConfig(row: AccountRow): WholesaleAccountConfig {
  return {
    accountId:          row.account_id,
    displayName:        row.display_name,
    notifyEmail:        row.notify_email,
    hasPendingTab:      row.has_pending_tab,
    canEditFulfillment: row.can_edit_fulfillment,
    contactNames:       row.contact_names ?? [],
    priceSingle:        row.price_single  ?? undefined,
    priceRpPack:        row.price_rp_pack ?? undefined,
    priceHwpPack:       row.price_hwp_pack ?? undefined,
    currencySymbol:     row.currency_symbol ?? "$",
    minQty:             row.min_qty       ?? undefined,
    qtyOptions:         row.qty_options   ?? undefined,
    packPrices:         row.pack_prices   ?? undefined,
  };
}

export async function getAccountByPin(pin: string): Promise<WholesaleAccountConfig | null> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("wholesale_accounts")
    .select("*")
    .eq("pin", pin)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return rowToConfig(data as AccountRow);
}

export async function getServerAccountByAccountId(
  accountId: string
): Promise<WholesaleAccountConfig | null> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("wholesale_accounts")
    .select("*")
    .eq("account_id", accountId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return rowToConfig(data as AccountRow);
}

/**
 * Validates the wholesale session cookie and returns the account config.
 * Replaces the two-step pattern of getSessionAccountId + ALL_ACCOUNT_IDS.has.
 * Returns null if the session is missing, invalid, or account is inactive.
 */
export async function validateWholesaleAccount(
  req: NextRequest
): Promise<WholesaleAccountConfig | null> {
  const accountId = getSessionAccountId(req);
  if (!accountId) return null;
  return getServerAccountByAccountId(accountId);
}
