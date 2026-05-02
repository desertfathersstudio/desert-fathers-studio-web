import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim() ?? "";
  if (input.length < 3) return NextResponse.json({ predictions: [] });

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [] });

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("components", "country:us");
  url.searchParams.set("types", "address");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data = await res.json() as { predictions?: { place_id: string; description: string }[]; status?: string; error_message?: string };

  return NextResponse.json({ predictions: data.predictions ?? [], status: data.status, error_message: data.error_message });
}
