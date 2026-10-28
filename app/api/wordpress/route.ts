import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

type WpItem = { id: number; name?: string; slug?: string; link?: string; message?: string; code?: string };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const siteUrl = safeUrl(body.siteUrl);
    const username = typeof body.username === "string" ? body.username.trim().slice(0, 150) : "";
    const appPassword = typeof body.appPassword === "string" ? body.appPassword.replace(/\s/g, "").slice(0, 300) : "";
    const action = body.action === "publish" ? "publish" : "test";
    const siteName = typeof body.siteName === "string" ? body.siteName.trim().slice(0, 80) : "";

    if (!siteUrl) return NextResponse.json({ error: "Use a site origin such as https://yournewswebsite.com." }, { status: 400 });
    if (!username || !appPassword) return NextResponse.json({ error: "Enter the WordPress username and an Application Password." }, { status: 400 });
    if (action === "publish" && !siteName) return NextResponse.json({ error: "Generate a configuration and enter a news brand name before publishing." }, { status: 400 });
    if (!(await isAllowedPublicHost(siteUrl.hostname))) {
      return NextResponse.json({ error: "The WordPress host must resolve only to public IP addresses." }, { status: 400 });
    }

    const auth = "Basic " + Buffer.from(username + ":" + appPassword).toString("base64");
    const api = async (path: string, method: "GET" | "POST", payload?: Record<string, unknown>) => {
      const response = await fetch(new URL("/wp-json/wp/v2/" + path, siteUrl), {
        method,
        headers: {
          Authorization: auth,
          Accept: "application/json",
          ...(payload ? { "Content-Type": "application/json" } : {})
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(12000)
      });
      if (response.status >= 300 && response.status < 400) {
        throw new Error("WordPress redirected the request. Use the final HTTPS site URL directly.");
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof data.message === "string" ? data.message : "WordPress API request failed (" + response.status + ").";
        throw new Error(message);
      }
      return data as WpItem[] | WpItem;
    };

    const user = await api("users/me?context=edit", "GET") as WpItem & { roles?: string[] };
    if (action === "test") {
      return NextResponse.json({
        ok: true,
        user: { name: user.name, slug: user.slug, roles: user.roles },
        siteUrl: siteUrl.origin,
        message: "WordPress authentication succeeded. No content was changed."
      });
    }

    const categories = ["Latest", "Gujarat", "India", "World", "Politics", "Business", "Sports", "Entertainment", "Technology"];
    const pages = [
      { title: "About", slug: "about", content: "<h2>About " + escapeHtml(siteName) + "</h2><p>Learn more about our newsroom, editorial mission and team.</p>" },
      { title: "Contact", slug: "contact", content: "<h2>Contact " + escapeHtml(siteName) + "</h2><p>Add your newsroom email, phone number and office address here.</p>" },
      { title: "Privacy Policy", slug: "privacy-policy", content: "<h2>Privacy Policy</h2><p>Replace this starter text with your site's reviewed privacy policy before launch.</p>" }
    ];
    const results = { categoriesCreated: [] as string[], categoriesExisting: [] as string[], pagesCreated: [] as string[], pagesExisting: [] as string[] };
    const failures: string[] = [];

    for (const name of categories) {
      const slug = slugify(name);
      try {
        const found = await api("categories?slug=" + encodeURIComponent(slug) + "&per_page=1", "GET") as WpItem[];
        if (found.length) { results.categoriesExisting.push(name); continue; }
        await api("categories", "POST", { name, slug });
        results.categoriesCreated.push(name);
      } catch (error) {
        failures.push("Category '" + name + "': " + (error instanceof Error ? error.message : "request failed"));
      }
    }

    for (const page of pages) {
      try {
        const found = await api("pages?slug=" + encodeURIComponent(page.slug) + "&per_page=1", "GET") as WpItem[];
        if (found.length) { results.pagesExisting.push(page.title); continue; }
        await api("pages", "POST", { title: page.title, slug: page.slug, content: page.content, status: "publish" });
        results.pagesCreated.push(page.title);
      } catch (error) {
        failures.push("Page '" + page.title + "': " + (error instanceof Error ? error.message : "request failed"));
      }
    }

    return NextResponse.json({
      ok: failures.length === 0,
      siteUrl: siteUrl.origin,
      results,
      failures,
      message: failures.length
        ? "Publishing finished with some errors. Review the per-item failures; successfully created items were kept."
        : "Starter categories and pages are ready. Review the Privacy Policy and Contact page before launching."
    }, { status: failures.length ? 207 : 200 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not reach WordPress. Check the site URL, HTTPS, credentials and REST API."
    }, { status: 502 });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
