import Image from "next/image";
import Link from "next/link";
import { CATALOG, stickerImageUrl } from "@/lib/catalog";
import { PACK_CONFIGS } from "@/lib/pack-configs";
import { PackAddToCartButton } from "@/components/d2c/PackAddToCartButton";
import { NotifyMeButton } from "@/components/d2c/NotifyMeButton";

interface PackDataProp {
  name: string;
  description: string;
  accentColor: string;
  packSize: number;
  retailPrice: number;
}

export function PackDetail({
  slug,
  imageMap = {},
  availableIndividually = new Set(),
  comingSoon = false,
  packData,
  stickerNames,
}: {
  slug: string;
  imageMap?: Record<string, string>;
  availableIndividually?: Set<string>;
  comingSoon?: boolean;
  packData?: PackDataProp;
  stickerNames?: string[];
}) {
  // Static config takes precedence for existing packs; DB-sourced packData fills the gap for new ones
  const config = PACK_CONFIGS[slug];

  const packName        = config?.name        ?? packData?.name        ?? "Pack";
  const packDescription = config?.description ?? packData?.description ?? "";
  const packPrice       = config?.price       ?? packData?.retailPrice  ?? 0;
  const accentColor     = config?.accent      ?? packData?.accentColor  ?? "var(--brand)";

  // Sticker list: prefer DB-sourced names, fall back to CATALOG for existing packs
  const effectiveStickers: { id: string; name: string; filename: string }[] = stickerNames
    ? stickerNames.map((name) => ({ id: name, name, filename: "" }))
    : CATALOG.filter((s) => s.category === (config?.category ?? ""));

  const packSize  = effectiveStickers.length || config?.packSize || packData?.packSize || 0;
  const soloCount = effectiveStickers.filter((s) => availableIndividually.has(s.name)).length;

  // The pack product itself for the cart button
  const packSticker = CATALOG.find((s) => s.id === slug) ?? {
    id: slug,
    name: packName,
    filename: config?.backCover ?? "",
    price: packPrice,
    category: "packs" as const,
    isPack: true as const,
    packSize,
  };

  // Back cover image: from imageMap (DB) or from static R2 path via backCover filename
  const backCoverSrc =
    imageMap[packName] ??
    (config?.backCover ? stickerImageUrl(config.backCover) : null);

  if (!config && !packData) return null;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-8">
        <Link
          href="/packs"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to packs
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-[1fr_1fr] gap-12 md:gap-20 items-start">

          {/* Back cover image */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "1/1",
              background: "white",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border)",
            }}
          >
            {backCoverSrc && (
              <Image
                src={backCoverSrc}
                alt={`${packName} — all included designs`}
                fill
                className="object-contain p-6"
                priority
              />
            )}
          </div>

          {/* Pack info */}
          <div className="md:sticky md:top-24">
            <h1
              className="mb-5 leading-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 300,
                color: "var(--text)",
              }}
            >
              {packName} — Set of {packSize}
            </h1>
            {packDescription && (
              <p
                className="mb-8 leading-relaxed"
                style={{ color: "var(--text-muted)", maxWidth: "44ch" }}
              >
                {packDescription}
              </p>
            )}

            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="text-2xl font-medium"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--brand)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${packPrice.toFixed(2)}
              </span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                for all {packSize} designs
              </span>
            </div>

            {/* Key callouts */}
            <div
              className="flex flex-col gap-2 mb-8 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <span>✦ {effectiveStickers.length} unique designs in this pack</span>
              {soloCount > 0 && (
                <span>✦ {soloCount} of {effectiveStickers.length} also available individually</span>
              )}
              <span>✦ 2&quot; die-cut, weather-resistant vinyl</span>
            </div>

            {comingSoon ? (
              <div className="flex flex-col gap-3">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.12em",
                    background: "var(--cream)",
                    color: "var(--brand)",
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-sans)",
                    width: "fit-content",
                  }}
                >
                  Coming Soon
                </span>
                <NotifyMeButton productName={packName} variant="full" />
              </div>
            ) : (
              <PackAddToCartButton pack={packSticker} />
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="max-w-7xl mx-auto px-6 md:px-10"
        style={{ borderTop: "1px solid var(--border)" }}
      />

      {/* Sticker grid */}
      {effectiveStickers.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.2em] font-medium mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                What&apos;s inside
              </p>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 400, color: "var(--text)" }}>
                {effectiveStickers.length} designs
              </p>
            </div>
            {/* Legend */}
            <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "inline-block",
                    width: 8, height: 8, borderRadius: "50%",
                    background: accentColor !== "var(--brand)" ? accentColor : "var(--brand)",
                    opacity: 0.7,
                  }}
                />
                Pack only
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "inline-block",
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--gold)",
                  }}
                />
                Also sold individually
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {effectiveStickers.map((sticker) => {
              const isIndividual = availableIndividually.has(sticker.name);
              const imgSrc =
                imageMap[sticker.name] ??
                (sticker.filename ? stickerImageUrl(sticker.filename) : null);

              return (
                <div key={sticker.id} className="group flex flex-col">
                  <div
                    className="relative aspect-square overflow-hidden"
                    style={{
                      background: "white",
                      borderRadius: "var(--radius-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {imgSrc && (
                      <Image
                        src={imgSrc}
                        alt={sticker.name}
                        fill
                        className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    )}
                    {isIndividual && (
                      <Link
                        href="/shop"
                        className="absolute inset-0"
                        aria-label={`Shop ${sticker.name} individually`}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: 8, right: 8,
                        width: 8, height: 8,
                        borderRadius: "50%",
                        background: isIndividual ? "var(--gold)" : "var(--brand)",
                        opacity: isIndividual ? 1 : 0.7,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex flex-col gap-0.5">
                    <p
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        lineHeight: 1.3,
                      }}
                    >
                      {sticker.name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.68rem",
                        color: isIndividual ? "var(--gold)" : "var(--text-muted)",
                        fontWeight: isIndividual ? 500 : 400,
                      }}
                    >
                      {isIndividual ? "Also sold individually" : "Pack only"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          {soloCount > 0 && (
            <div
              className="mt-14 mx-auto max-w-xl text-center"
              style={{
                padding: "1.25rem 1.5rem",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--text)", marginBottom: "0.4rem" }}>
                Want just a few?
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {soloCount} sticker{soloCount !== 1 ? "s" : ""} from this pack can be purchased individually for $2.00 each. Browse them in the main catalog.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--brand)" }}
              >
                Browse individual stickers →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
