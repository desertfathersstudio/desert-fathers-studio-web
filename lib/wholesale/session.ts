import crypto from "crypto";

export const COOKIE_NAME = "ws_auth";
const MAX_AGE_SECS = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const s = process.env.WHOLESALE_SESSION_SECRET;
  if (!s) console.warn("[wholesale/session] WHOLESALE_SESSION_SECRET not set — using dev fallback");
  return s ?? "dev-insecure-fallback-set-WHOLESALE_SESSION_SECRET-in-env";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(accountId: string): string {
  const exp = Date.now() + MAX_AGE_SECS * 1000;
  const payload = Buffer.from(JSON.stringify({ accountId, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx < 0) return null;
  const payload = token.slice(0, dotIdx);
  const sig     = token.slice(dotIdx + 1);
  const expected = sign(payload);
  try {
    // timingSafeEqual requires equal-length buffers; catch throws if lengths differ
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const { accountId, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!accountId || typeof exp !== "number" || Date.now() > exp) return null;
    return String(accountId);
  } catch {
    return null;
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name:     COOKIE_NAME,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/api/wholesale",     // Scope to wholesale API only
    maxAge:   MAX_AGE_SECS,
  };
}

export function clearSessionCookieOptions() {
  return {
    name:     COOKIE_NAME,
    value:    "",
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/api/wholesale",
    maxAge:   0,
  };
}
