import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

function isPublicIpv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b, c] = p;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPublicIpv4(ip);
  if (isIP(ip) === 6) {
    const value = ip.toLowerCase();
    return value !== "::" && value !== "::1" &&
      !value.startsWith("fc") && !value.startsWith("fd") &&
      !value.startsWith("fe8") && !value.startsWith("fe9") &&
      !value.startsWith("fea") && !value.startsWith("feb") &&
      !value.startsWith("::ffff:") && !value.startsWith("2001:db8:");
  }
  return false;
}
async function isAllowedPublicHost(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") ||
      host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".test")) return false;
  if (isIP(host)) return isPublicIp(host);
  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((entry) => isPublicIp(entry.address));
  } catch {
    return false;
  }
}
function safeUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const siteUrl = safeUrl(body.siteUrl);
    const username = typeof body.username === "string" ? body.username.trim().slice(0, 150) : "";
    const appPassword = typeof body.appPassword === "string" ? body.appPassword.replace(/\s/g, "").slice(0, 300) : "";
    if (!siteUrl) return NextResponse.json({ error: "Use a site origin such as https://yournewswebsite.com." }, { status: 400 });
    if (!username || !appPassword) return NextResponse.json({ error: "Enter the WordPress username and an Application Password." }, { status: 400 });
    if (!(await isAllowedPublicHost(siteUrl.hostname))) {
      return NextResponse.json({ error: "The WordPress host must resolve only to public IP addresses." }, { status: 400 });
    }
    const auth = Buffer.from(username + ":" + appPassword).toString("base64");
    const response = await fetch(new URL("/wp-json/wp/v2/users/me?context=edit", siteUrl), {
      headers: { Authorization: "Basic " + auth, Accept: "application/json" },
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000)
    });
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: "WordPress redirected the request. Use the final HTTPS site URL directly." }, { status: 400 });
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: typeof data.message === "string" ? data.message : "WordPress connection failed (" + response.status + "). Check REST API access and credentials." }, { status: 400 });
    return NextResponse.json({ ok: true, user: { name: data.name, slug: data.slug, roles: data.roles }, siteUrl: siteUrl.origin, message: "WordPress authentication succeeded. This connection test does not publish or change content." });
  } catch {
    return NextResponse.json({ error: "Could not reach WordPress. Check the site URL, HTTPS, network access and REST API." }, { status: 502 });
  }
}
