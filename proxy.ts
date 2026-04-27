import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocal) {
    // Dev: use ?front=wholesale or ?front=admin to test subdomains
    const front = url.searchParams.get("front");
    if (front === "wholesale") {
      url.searchParams.delete("front");
      url.pathname = `/wholesale-portal${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    if (front === "admin") {
      url.searchParams.delete("front");
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Production: route by subdomain
  const subdomain = host.split(".")[0];

  if (subdomain === "wholesale") {
    url.pathname = `/wholesale-portal${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (subdomain === "admin") {
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
