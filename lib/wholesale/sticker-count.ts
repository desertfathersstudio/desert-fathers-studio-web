/**
 * Pack-aware sticker count.
 *
 * Counts the total number of individual stickers represented by a list of
 * order/cart items, expanding pack quantities by their constituent sticker
 * count.
 *
 * Resolution order:
 *  1. Virtual pack aliases (RP_PACK / HWP_PACK) and their DB SKU equivalents
 *     (PK-1 / PK-2) — always fixed at 10 and 23, handles legacy orders.
 *  2. "Set of N" in the size field — populated by the cart for all DB packs
 *     (PK-3+) going forward; works automatically for any new pack.
 *  3. Legacy fallback for PK-3 orders submitted before the size field was
 *     standardised.
 *  4. Everything else counts as 1 sticker (individual designs).
 */
export function stickerCount(
  items: { productId: string; size?: string | null; qty: number }[]
): number {
  return items.reduce((total, item) => {
    const id = item.productId.toUpperCase();

    if (id === "HWP_PACK" || id === "PK-2") return total + item.qty * 23;
    if (id === "RP_PACK"  || id === "PK-1") return total + item.qty * 10;

    const m = item.size?.match(/^Set of (\d+)$/i);
    if (m) return total + item.qty * parseInt(m[1], 10);

    // Legacy: PK-3 orders before "Set of N" convention
    if (id === "PK-3") return total + item.qty * 6;

    return total + item.qty;
  }, 0);
}
