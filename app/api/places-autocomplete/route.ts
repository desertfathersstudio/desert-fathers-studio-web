import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim() ?? "";
  if (input.length < 3) return NextResponse.json({ predictions: [] });

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [] });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.desertfathersstudio.com";
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "Referer": origin,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["us"],
      includedPrimaryTypes: ["street_address", "route"],
    }),
  });

  const data = await res.json() as {
    suggestions?: { placePrediction?: { placeId: string; text?: { text: string } } }[];
    error?: { message: string };
  };

  if (data.error) return NextResponse.json({ predictions: [], error: data.error.message });

  const predictions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .map((p) => ({ place_id: p!.placeId, description: p!.text?.text ?? "" }));

  return NextResponse.json({ predictions });
}
