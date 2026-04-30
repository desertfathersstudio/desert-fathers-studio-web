/**
 * Wholesale pricing rules — exact port of the Apps Script logic.
 * Prices updated to new wholesale tier: $0.50/sticker, $3.00/RP set, $7.00/HWP set.
 */

export const WS_PRICE_SINGLE  = 0.50;
export const WS_PRICE_RP_PACK = 3.00;
export const WS_PRICE_HWP_PACK = 7.00;

export const RP_PACK_SIZE  = 10;
export const HWP_PACK_SIZE = 23;

const HWP_NAMES = [
  "raising of lazarus",
  "jesus entry into jerusalem",
  "jesus drives out the merchants",
  "cursing the fig tree",
  "jesus teaching in the temple",
  "the wise and the foolish virgins",
  "anointing at jesus feet",
  "judas receiving silver",
  "washing of the feet",
  "the last supper",
  "jesus prayer in gethsemenie",
  "judas betrayal",
  "high priest judgement",
  "rooster craw",
  "jesus scourging",
  "pilate washing his hands",
  "laughed at by romans",
  "face imprint on the handkerchief",
  "crucifixion",
  "descent from the cross",
  "tomb burial",
  "christ in hades",
  "resurrection hwp",
];

const PACK_STANDALONE_NAMES = [
  "ascension",
  "pentecost",
  "jesus entry into jerusalem",
  "the last supper",
  "prayer in gethsemane",
  "jesus prayer in gethsemane",
  "jesus prayer in gethsemenie",
  "prayer in gethsemenie",
  "christ in hades",
];

/** Normalize a string for pack name matching (lowercase, strip non-alphanumeric). */
export function normalizeForPack(str: string): string {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns "HWP", "RP", or "" for a given product.
 *
 * @example
 * getPackType("The Last Supper", "Holy Week", "HWP-10") // "HWP"
 * getPackType("Resurrection Pack", "Packs", "RP_PACK")  // "RP"
 * getPackType("Pantokrator", "Christ", "STK-42")        // ""
 */
export function getPackType(name: string, category: string, sku: string): "HWP" | "RP" | "" {
  const n   = normalizeForPack(name);
  const c   = normalizeForPack(category ?? "");
  const pid = String(sku ?? "").toUpperCase();

  if (pid === "RP_PACK" || c.includes("resurrection pack") || n.startsWith("rp")) return "RP";
  if (pid === "HWP_PACK" || c.includes("holy week pack")) return "HWP";

  for (const hwpName of HWP_NAMES) {
    if (n === hwpName || n.includes(hwpName)) return "HWP";
  }
  return "";
}

/**
 * Returns true if this pack design can also be purchased individually.
 *
 * @example
 * isStandalonePackDesign("The Last Supper")     // true
 * isStandalonePackDesign("Judas Receiving Silver") // false
 */
export function isStandalonePackDesign(name: string): boolean {
  const n = normalizeForPack(name);
  for (const standalone of PACK_STANDALONE_NAMES) {
    if (n === standalone || n.includes(standalone)) return true;
  }
  return false;
}

/** Returns the wholesale unit price for a product (by sku). */
export function unitPriceForSku(sku: string): number {
  const pid = String(sku).toUpperCase();
  if (pid === "RP_PACK")  return WS_PRICE_RP_PACK;
  if (pid === "HWP_PACK") return WS_PRICE_HWP_PACK;
  return WS_PRICE_SINGLE;
}

/** Returns the price label string for a product. */
export function priceLabelForProduct(opts: {
  sku: string;
  packType: "HWP" | "RP" | "";
  packOnly: boolean;
}): string {
  const pid = String(opts.sku).toUpperCase();
  if (pid === "RP_PACK")  return `$${WS_PRICE_RP_PACK.toFixed(2)}/set`;
  if (pid === "HWP_PACK") return `$${WS_PRICE_HWP_PACK.toFixed(2)}/set`;
  if (opts.packOnly) {
    const packName = opts.packType === "HWP" ? "Holy Week Pack" : "Resurrection Pack";
    const packPrice = opts.packType === "HWP" ? WS_PRICE_HWP_PACK : WS_PRICE_RP_PACK;
    return `${packName} $${packPrice.toFixed(2)}/set`;
  }
  return `$${WS_PRICE_SINGLE.toFixed(2)}/sticker`;
}

/** Formats a number as a USD dollar amount. */
export function money(n: number): string {
  return `$${Number(n).toFixed(2)}`;
}

/**
 * Generates a stable background color for a category name,
 * matching the Apps Script catColor() hash algorithm.
 *
 * @example
 * categoryBgColor("Saints") // "hsl(204, 55%, 88%)"
 */
export function categoryBgColor(cat: string): string {
  const str = String(cat ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash * 137) % 360;
  return `hsl(${hue}, 55%, 88%)`;
}

/** Generates a stable text color for a category name. */
export function categoryTextColor(cat: string): string {
  const str = String(cat ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash * 137) % 360;
  return `hsl(${hue}, 45%, 30%)`;
}

/** Extracts a Google Drive file ID from a Drive URL. */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const m1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

/** Constructs a Drive thumbnail URL for a given file ID and size. */
export function driveThumbUrl(fileId: string, sz: string, cacheBust?: string): string {
  const v = cacheBust ?? String(Date.now());
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${sz}&v=${v}`;
}

/** Returns a usable image URL for a product (Supabase Storage or Drive thumbnail). */
export function productImageUrl(
  imageUrl: string | null,
  driveLink: string | null,
  sz: string,
  cacheBust?: string
): string {
  if (imageUrl && imageUrl.startsWith("http")) return imageUrl;
  const fid = extractDriveFileId(driveLink ?? "");
  if (fid) return driveThumbUrl(fid, sz, cacheBust);
  return "";
}
