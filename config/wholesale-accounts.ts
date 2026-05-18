// SECURITY: Account data (including PINs) is now stored in the wholesale_accounts
// DB table and accessed via lib/wholesale/accounts-server.ts (server-only).
// This file contains only the shared type interface used across the codebase.

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
  /** Currency symbol shown in the portal UI (default "$") */
  currencySymbol?: string;
  /** Minimum sticker quantity per line item (default 50; abbey is 25) */
  minQty?: number;
  /** Fixed set of allowed order quantities. When set, replaces the global QTY_OPTIONS dropdown. */
  qtyOptions?: number[];
  /** Wholesale price overrides for specific pack SKUs (e.g. { "PK-3": 2.25 }) */
  packPrices?: Record<string, number>;
}
