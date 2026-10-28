import { NextResponse } from "next/server";
import { authorizedProject, database } from "@/lib/projects";

export const runtime = "nodejs";

function validDomain(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (domain.length > 253 || domain.length < 4 || domain.includes("://") || domain.includes("/") ||
      !domain.includes(".") || domain.startsWith(".") || domain.endsWith(".") ||
      !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ||
      domain.endsWith(".vercel.app") || domain === "localhost") return null;
  return domain;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const project = await authorizedProject(slug, request);
    if (!project) return NextResponse.json({ error: "Management token is missing or invalid." }, { status: 401 });
    const body = await request.json();
    const domain = validDomain(body?.domain);
    if (!domain) return NextResponse.json({ error: "Enter a valid custom domain, for example news.example.com." }, { status: 400 });
    const token = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    if (!token || !vercelProjectId) return NextResponse.json({ error: "Custom-domain automation is not configured. Add VERCEL_TOKEN and VERCEL_PROJECT_ID in Vercel environment variables." }, { status: 503 });
    const teamQuery = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
    if (body?.action === "verify") {
      const verifyResponse = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectId)}/domains/${encodeURIComponent(domain)}${teamQuery}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(12000)
      });
      const verifyData = await verifyResponse.json().catch(() => ({})) as { verified?: boolean; error?: { message?: string } };
      if (!verifyResponse.ok) return NextResponse.json({ error: verifyData.error?.message || "Could not verify the domain yet." }, { status: 400 });
      await database()`UPDATE newsforge_projects SET domain_verified = ${verifyData.verified === true}, domain_status = ${verifyData.verified === true ? "verified" : "verification-required"} WHERE id = ${project.id} AND lower(custom_domain) = ${domain}`;
      return NextResponse.json({ ok: true, domain, verified: verifyData.verified === true, message: verifyData.verified ? "Domain verified and connected." : "Vercel has not verified the domain yet. Check DNS records in Vercel Settings → Domains, then retry." });
    }
    const response = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(vercelProjectId)}/domains${teamQuery}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: domain }), cache: "no-store", signal: AbortSignal.timeout(12000)
    });
    const data = await response.json().catch(() => ({})) as { name?: string; verified?: boolean; error?: { message?: string }; verification?: Array<{ type?: string; domain?: string; value?: string; reason?: string }> };
    if (!response.ok && response.status !== 409) {
      return NextResponse.json({ error: data.error?.message || "Vercel could not add this domain. Check domain ownership and project permissions." }, { status: response.status === 401 || response.status === 403 ? 502 : 400 });
    }
    const verified = data.verified === true;
    const sql = database();
    await sql`UPDATE newsforge_projects SET custom_domain = ${domain}, domain_verified = ${verified},
      domain_status = ${verified ? "verified" : "verification-required"}, expires_at = NULL, published_at = COALESCE(published_at, now()) WHERE id = ${project.id}`;
    return NextResponse.json({
      ok: true, domain, verified,
      dnsInstructions: verified ? [] : (data.verification || []),
      message: verified ? "Domain connected and verified." : "Domain added to Vercel, but DNS ownership verification is still required. Add the DNS records shown by Vercel, then retry."
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not connect custom domain.";
    return NextResponse.json({ error: message }, { status: message.includes("DATABASE_URL") ? 503 : 500 });
  }
}
