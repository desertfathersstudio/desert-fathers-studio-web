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
    minQty: 5,
    qtyOptions: [5, 10],
    packPrices: { "PK-3": 2.00 },
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
  "4372": {
    accountId:          "antony",
    displayName:        "Saint Antony Coptic Orthodox Monastery",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      false,
    canEditFulfillment: false,
    contactNames:       [],
    priceSingle:  0.90,
    priceRpPack:  5.00,
    priceHwpPack: 10.00,
  },
  "3874": {
    accountId:          "paul",
    displayName:        "Saint Paul Coptic Orthodox Monastery",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      false,
    canEditFulfillment: false,
    contactNames:       [],
    priceSingle:  0.90,
    priceRpPack:  5.00,
    priceHwpPack: 10.00,
  },
  "2612": {
    accountId:          "katherine",
    displayName:        "Saint Katherine of Alexandria & Saint Verena Coptic Orthodox Convent",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      false,
    canEditFulfillment: false,
    contactNames:       [],
    priceSingle:  0.90,
    priceRpPack:  5.00,
    priceHwpPack: 10.00,
  },
  "8419": {
    accountId:          "shenouda",
    displayName:        "Saint Shenouda Monastery",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      false,
    canEditFulfillment: false,
    contactNames:       [],
    priceSingle:  1.40,
    priceRpPack:  8.00,
    priceHwpPack: 16.00,
    currencySymbol: "A$",
  },
  "8640": {
    accountId:          "maryjohn",
    displayName:        "St. Mary & St. John Convent, Ohio",
    notifyEmail:        "st.mosesbookstore@gmail.com",
    hasPendingTab:      false,
    canEditFulfillment: false,
    contactNames:       [],
    priceSingle:  0.90,
    priceRpPack:  5.00,
    priceHwpPack: 10.00,
  },
};

export function getAccountByPin(pin: string): WholesaleAccountConfig | null {
  return ACCOUNT_MAPPING[pin] ?? null;
}

export function getServerAccountByAccountId(accountId: string): WholesaleAccountConfig | null {
  return Object.values(ACCOUNT_MAPPING).find((a) => a.accountId === accountId) ?? null;
}
