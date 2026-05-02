// SERVER-ONLY — never import this in a client component.
// Contains the PIN→account mapping. Importing in a client file
// would expose all PINs in the public JavaScript bundle.

import type { WholesaleAccountConfig } from "@/config/wholesale-accounts";

const ACCOUNT_MAPPING: Record<string, WholesaleAccountConfig> = {
  "1001": {
    accountId: "abbey",
    displayName: "St. Mary and St. Moses Abbey",
    notifyEmail: "st.mosesbookstore@gmail.com",
    hasPendingTab: true,
    canEditFulfillment: true,
  },
  // Add additional wholesale accounts here (server-only):
  // "XXXX": { accountId: "...", displayName: "...", ... },
};

export function getAccountByPin(pin: string): WholesaleAccountConfig | null {
  return ACCOUNT_MAPPING[pin] ?? null;
}
