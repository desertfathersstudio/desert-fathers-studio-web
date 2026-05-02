// SERVER-ONLY — never import this in a client component.
// Contains the PIN→account mapping. Importing in a client file
// would expose all PINs in the public JavaScript bundle.

import type { WholesaleAccountConfig } from "@/config/wholesale-accounts";

const ACCOUNT_MAPPING: Record<string, WholesaleAccountConfig> = {
  "1001": {
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
  "5095": {
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
};

export function getAccountByPin(pin: string): WholesaleAccountConfig | null {
  return ACCOUNT_MAPPING[pin] ?? null;
}
