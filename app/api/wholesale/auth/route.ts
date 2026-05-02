import { NextRequest, NextResponse } from "next/server";
import { getAccountByPin } from "@/lib/wholesale/accounts-server";
import { createSessionToken, sessionCookieOptions } from "@/lib/wholesale/session";
import { WS_PRICE_SINGLE, WS_PRICE_RP_PACK, WS_PRICE_HWP_PACK } from "@/lib/wholesale/pricing";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per IP per 15 minutes
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!checkRateLimit(`ws-auth:${ip}`, 5, 900)) {
    console.warn("[SECURITY] wholesale auth rate limited:", ip);
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  let body: { pin?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!pin) return NextResponse.json({ error: "PIN required" }, { status: 400 });

  const account = getAccountByPin(pin);
  if (!account) {
    // Constant-time-ish delay to slow brute force
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
    console.warn("[AUTH-FAIL] wholesale wrong PIN from IP:", ip);
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const token = createSessionToken(account.accountId);
  const res = NextResponse.json({
    accountId:          account.accountId,
    displayName:        account.displayName,
    notifyEmail:        account.notifyEmail,
    hasPendingTab:      account.hasPendingTab,
    canEditFulfillment: account.canEditFulfillment,
    contactNames:       account.contactNames,
    priceSingle:        account.priceSingle  ?? WS_PRICE_SINGLE,
    priceRpPack:        account.priceRpPack  ?? WS_PRICE_RP_PACK,
    priceHwpPack:       account.priceHwpPack ?? WS_PRICE_HWP_PACK,
  });

  res.cookies.set(sessionCookieOptions(token));
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: "ws_auth", value: "", maxAge: 0, path: "/api/wholesale", httpOnly: true, sameSite: "lax" });
  return res;
}
