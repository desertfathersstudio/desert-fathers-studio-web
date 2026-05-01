// TAX DISABLED: Not collecting sales tax until lifetime sales cross $1,000.
// To re-enable: set automatic_tax.enabled = true in PaymentIntent,
// restore tax line in checkout UI, and ensure NC tax registration is active in Stripe Dashboard.

// Approximate USPS zone lookup from NC origin.
// First 3 digits of destination ZIP → zone 1-8.
// Derived from USPS zone charts — documented approximation.
// Swap getZoneFromPrefix() with a USPS Zone API or Shippo call for production accuracy.

export const ORIGIN_ZIP = "27601"; // Raleigh, NC — update to exact store location
export const FREE_SHIPPING_THRESHOLD_DOLLARS = 35;

const RATE_BY_ZONE: Record<number, number> = {
  1: 4, 2: 4, 3: 4, 4: 4,
  5: 5, 6: 5,
  7: 6, 8: 6,
};

function getZoneFromPrefix(prefix: number): number {
  // NC itself
  if (prefix >= 270 && prefix <= 289) return 2;

  // Southeast
  if (prefix >= 290 && prefix <= 299) return 2; // SC
  if (prefix >= 300 && prefix <= 319) return 3; // GA north
  if (prefix >= 320 && prefix <= 349) return 4; // FL
  if (prefix >= 350 && prefix <= 369) return 3; // AL
  if (prefix >= 370 && prefix <= 389) return 3; // TN
  if (prefix >= 390 && prefix <= 399) return 4; // MS south

  // Midwest / Great Lakes
  if (prefix >= 400 && prefix <= 427) return 4; // KY
  if (prefix >= 430 && prefix <= 459) return 4; // OH
  if (prefix >= 460 && prefix <= 479) return 5; // IN
  if (prefix >= 480 && prefix <= 499) return 5; // MI
  if (prefix >= 500 && prefix <= 528) return 5; // IA
  if (prefix >= 530 && prefix <= 549) return 5; // WI
  if (prefix >= 550 && prefix <= 567) return 6; // MN
  if (prefix >= 570 && prefix <= 577) return 6; // SD
  if (prefix >= 580 && prefix <= 588) return 6; // ND
  if (prefix >= 590 && prefix <= 599) return 7; // MT

  // South central / Plains
  if (prefix >= 600 && prefix <= 631) return 5; // IL, MO
  if (prefix >= 633 && prefix <= 658) return 5; // MO, KS
  if (prefix >= 660 && prefix <= 679) return 6; // KS west
  if (prefix >= 680 && prefix <= 693) return 6; // NE
  if (prefix >= 700 && prefix <= 714) return 4; // LA
  if (prefix >= 716 && prefix <= 729) return 5; // AR
  if (prefix >= 730 && prefix <= 749) return 5; // OK
  if (prefix >= 750 && prefix <= 799) return 6; // TX

  // Mountain / Southwest
  if (prefix >= 800 && prefix <= 816) return 7; // CO
  if (prefix >= 820 && prefix <= 831) return 7; // WY
  if (prefix >= 832 && prefix <= 838) return 7; // ID
  if (prefix >= 840 && prefix <= 847) return 7; // UT
  if (prefix >= 850 && prefix <= 865) return 8; // AZ
  if (prefix >= 870 && prefix <= 884) return 7; // NM
  if (prefix >= 889 && prefix <= 898) return 8; // NV

  // West Coast / Territories
  if (prefix >= 900 && prefix <= 961) return 8; // CA
  if (prefix >= 967 && prefix <= 968) return 8; // HI
  if (prefix >= 970 && prefix <= 979) return 8; // OR
  if (prefix >= 980 && prefix <= 994) return 8; // WA
  if (prefix >= 995 && prefix <= 999) return 8; // AK

  // Northeast
  if (prefix >= 10 && prefix <= 27) return 4;   // MA
  if (prefix >= 28 && prefix <= 29) return 4;   // RI
  if (prefix >= 30 && prefix <= 49) return 4;   // NH, ME, VT
  if (prefix >= 60 && prefix <= 69) return 4;   // CT
  if (prefix >= 70 && prefix <= 89) return 4;   // NJ
  if (prefix >= 100 && prefix <= 149) return 4; // NY
  if (prefix >= 150 && prefix <= 199) return 3; // PA, DE
  if (prefix >= 200 && prefix <= 219) return 3; // DC, MD
  if (prefix >= 220 && prefix <= 246) return 2; // VA
  if (prefix >= 247 && prefix <= 269) return 3; // WV

  return 5; // Default to middle zone
}

export interface ShippingResult {
  costDollars: number;
  costCents: number;
  zone: number;
  isFree: boolean;
}

export function calculateShipping(
  subtotalDollars: number,
  shippingZip: string
): ShippingResult {
  if (subtotalDollars >= FREE_SHIPPING_THRESHOLD_DOLLARS) {
    return { costDollars: 0, costCents: 0, zone: 0, isFree: true };
  }

  const prefix = parseInt(shippingZip.substring(0, 3), 10);
  if (isNaN(prefix)) {
    return { costDollars: 5, costCents: 500, zone: 5, isFree: false };
  }

  const zone = getZoneFromPrefix(prefix);
  const costDollars = RATE_BY_ZONE[zone] ?? 5;
  return { costDollars, costCents: costDollars * 100, zone, isFree: false };
}
