import { NextRequest, NextResponse } from "next/server";

interface AddressComponent { types: string[]; long_name: string; short_name: string; }

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("place_id")?.trim() ?? "";
  if (!placeId) return NextResponse.json({ result: null });

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ result: null });

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "address_components");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data = await res.json() as { result?: { address_components?: AddressComponent[] } };

  return NextResponse.json({ result: data.result ?? null });
}
