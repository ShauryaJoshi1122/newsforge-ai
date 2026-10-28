import { NextResponse } from "next/server";
function safeUrl(value: unknown): URL | null { if (typeof value !== "string") return null; try { const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password) return null; return url; } catch { return null; } }
export async function POST(request: Request) {
  try {
    const body = await request.json(); const siteUrl = safeUrl(body.siteUrl);
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const appPassword = typeof body.appPassword === "string" ? body.appPassword.replace(/\s/g, "") : "";
    if (!siteUrl) return NextResponse.json({ error: "Use a valid HTTPS WordPress site URL." }, { status: 400 });
    if (!username || !appPassword) return NextResponse.json({ error: "Enter the WordPress username and an Application Password." }, { status: 400 });
    const auth = Buffer.from(username + ":" + appPassword).toString("base64");
    const response = await fetch(new URL("/wp-json/wp/v2/users/me?context=edit", siteUrl), { headers: { Authorization: "Basic " + auth, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: typeof data.message === "string" ? data.message : "WordPress connection failed (" + response.status + "). Check REST API access and credentials." }, { status: 400 });
    return NextResponse.json({ ok: true, user: { name: data.name, slug: data.slug, roles: data.roles }, siteUrl: siteUrl.origin, message: "WordPress authentication succeeded. This connection test does not publish or change content." });
  } catch { return NextResponse.json({ error: "Could not reach WordPress. Check the site URL, HTTPS, network access and REST API." }, { status: 502 }); }
}
