/**
 * Appends ?v={epoch_ms} to R2/CDN URLs so each image_updated_at gets a unique
 * cache key. Returns null for missing URLs, passes through relative/non-http URLs.
 */
export function withVersion(
  url: string | null | undefined,
  imageUpdatedAt: string | null | undefined,
): string | null {
  if (!url) return null;
  if (!url.startsWith("http")) return url;
  if (!imageUpdatedAt) return url;
  return `${url}?v=${new Date(imageUpdatedAt).getTime()}`;
}
