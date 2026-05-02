// SECURITY: ACCOUNT_MAPPING and getAccountByPin moved to
// lib/wholesale/accounts-server.ts (server-only) to keep PINs out of the
// client-side JS bundle. Only account IDs (not PINs) live here.

export interface WholesaleAccountConfig {
  accountId: string;
  displayName: string;
  notifyEmail: string;
  hasPendingTab: boolean;
  canEditFulfillment: boolean;
  /** Preset names shown in the Order tab name dropdown */
  contactNames: string[];
  /** Per-account pricing overrides (undefined = use global wholesale defaults) */
  priceSingle?: number;
  priceRpPack?: number;
  priceHwpPack?: number;
}

// Client-safe: accountIds only, no PINs.
const KNOWN_ACCOUNTS: WholesaleAccountConfig[] = [
  {
    accountId:          "abbey",
    displayName:        "St. Mary and St. Moses Abbey",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      true,
    canEditFulfillment: true,
    contactNames: [
      "Fr. Arsanios Abba Moses",
      "Fr. Karas Abba Moses",
      "Fr. Zosima Abba Moses",
      "Br. Abanob Abba Moses",
    ],
  },
  {
    accountId:          "demiana",
    displayName:        "St. Demiana Convent, GA",
    notifyEmail:        "stdemianabookstore@suscopts.org",
    hasPendingTab:      false,
    canEditFulfillment: false,
    contactNames: ["Omina Dolagy"],
    priceSingle:  0.90,
    priceRpPack:  5.00,
    priceHwpPack: 10.00,
  },
];

export function getAccountById(accountId: string): WholesaleAccountConfig | null {
  return KNOWN_ACCOUNTS.find((a) => a.accountId === accountId) ?? null;
}

export const ALL_ACCOUNT_IDS = new Set(KNOWN_ACCOUNTS.map((a) => a.accountId));
