import { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "./session";

/** Reads the wholesale session cookie and returns the verified accountId, or null. */
export function getSessionAccountId(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
