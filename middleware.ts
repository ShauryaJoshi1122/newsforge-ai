import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const path = request.nextUrl.pathname;
  const baseDomain = process.env.PREVIEW_BASE_DOMAIN?.toLowerCase().replace(/^\.+|\.+$/g, "");
  if (baseDomain && hostname.endsWith("." + baseDomain)) {
    const slug = hostname.slice(0, -(baseDomain.length + 1));
    if (/^[a-z0-9-]{3,48}$/.test(slug) && (path === "/" || path === "/preview")) {
      const url = request.nextUrl.clone();
      url.pathname = "/preview";
      url.searchParams.set("project", slug);
      return NextResponse.rewrite(url);
    }
  }
  const isAppHost = hostname === "localhost" || hostname.endsWith(".localhost") ||
    hostname.endsWith(".vercel.app") || (process.env.APP_PRIMARY_DOMAIN && hostname === process.env.APP_PRIMARY_DOMAIN.toLowerCase());
  if (!isAppHost && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/preview";
    url.searchParams.set("domain", hostname);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"] };
