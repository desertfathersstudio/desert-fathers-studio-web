// SECURITY: ACCOUNT_MAPPING and getAccountByPin moved to
// lib/wholesale/accounts-server.ts (server-only) to keep PINs out of the
// client-side JS bundle. Only account IDs (not PINs) live here.

export interface WholesaleAccountConfig {
  accountId: string;
  displayName: string;
  notifyEmail: string;
  hasPendingTab: boolean;
  canEditFulfillment: boolean;
}

// Client-safe: accountIds only, no PINs.
const KNOWN_ACCOUNTS: WholesaleAccountConfig[] = [
  {
    accountId:          "abbey",
    displayName:        "St. Mary and St. Moses Abbey",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      true,
    canEditFulfillment: true,
  },
  // Add additional accounts here (mirror accounts-server.ts):
];

export function getAccountById(accountId: string): WholesaleAccountConfig | null {
  return KNOWN_ACCOUNTS.find((a) => a.accountId === accountId) ?? null;
}

export const ALL_ACCOUNT_IDS = new Set(KNOWN_ACCOUNTS.map((a) => a.accountId));
