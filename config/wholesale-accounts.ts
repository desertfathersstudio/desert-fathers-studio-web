export interface WholesaleAccountConfig {
  accountId: string;
  displayName: string;
  notifyEmail: string;
  hasPendingTab: boolean;
  canEditFulfillment: boolean;
}

export const ACCOUNT_MAPPING: Record<string, WholesaleAccountConfig> = {
  "4438": {
    accountId: "abbey",
    displayName: "St. Mary and St. Moses Abbey",
    notifyEmail: "st.mosesbookstore@gmail.com",
    hasPendingTab: true,
    canEditFulfillment: true,
  },
  // Add more wholesale accounts here:
  // "2222": {
  //   accountId: "stmark",
  //   displayName: "St. Mark Coptic Church",
  //   notifyEmail: "bookstore@stmark.org",
  //   hasPendingTab: false,
  //   canEditFulfillment: true,
  // },
};

export function getAccountByPin(pin: string): WholesaleAccountConfig | null {
  return ACCOUNT_MAPPING[pin] ?? null;
}

export function getAccountById(accountId: string): WholesaleAccountConfig | null {
  return (
    Object.values(ACCOUNT_MAPPING).find((a) => a.accountId === accountId) ?? null
  );
}

export const ALL_ACCOUNT_IDS = new Set(
  Object.values(ACCOUNT_MAPPING).map((a) => a.accountId)
);
