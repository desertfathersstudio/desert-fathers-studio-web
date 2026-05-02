import { NextRequest, NextResponse } from "next/server";

interface AddressComponent { types: string[]; longText: string; shortText: string; }

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("place_id")?.trim() ?? "";
  if (!placeId) return NextResponse.json({ result: null });

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ result: null });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.desertfathersstudio.com";
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "addressComponents",
      "Referer": origin,
    },
  });

  const data = await res.json() as { addressComponents?: AddressComponent[] };

  // Normalize to legacy field names so DetailsForm.tsx doesn't need changes
  const address_components = (data.addressComponents ?? []).map((c) => ({
    types: c.types,
    long_name: c.longText,
    short_name: c.shortText,
  }));

  return NextResponse.json({ result: { address_components } });
}
