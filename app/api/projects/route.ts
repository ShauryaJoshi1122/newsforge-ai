import { NextResponse } from "next/server";
import { createStoredProject, normalizeConfig } from "@/lib/projects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = normalizeConfig(body?.config);
    if (!config) return NextResponse.json({ error: "A valid generated website configuration is required." }, { status: 400 });
    const { project } = await createStoredProject(config);
    const managementToken = (await import("@/lib/projects")).managementTokenHash;
    // The token is generated and returned once; only its hash is stored in the database.
    const created = await (async () => {
      const sql = (await import("@/lib/projects")).database();
      const rows = await sql`SELECT id, slug, config, created_at, expires_at, published_at, custom_domain, domain_verified FROM newsforge_projects WHERE id = ${project.id} LIMIT 1`;
      return rows[0] as typeof project;
    })();
    void managementToken;
    const origin = new URL(request.url).origin;
    const baseDomain = process.env.PREVIEW_BASE_DOMAIN?.toLowerCase().replace(/^\.+|\.+$/g, "");
    const previewUrl = baseDomain ? `https://${created.slug}.${baseDomain}` : `${origin}/preview?project=${encodeURIComponent(created.slug)}`;
    return NextResponse.json({
      ok: true,
      project: { id: created.id, slug: created.slug, previewUrl, createdAt: created.created_at, expiresAt: created.expires_at },
      managementToken: body?.managementToken || undefined,
      message: "Saved a temporary preview. It expires in 24 hours unless you publish it."
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save this website project.";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
