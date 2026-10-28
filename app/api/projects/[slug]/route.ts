import { NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/projects";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    if (!/^[a-z0-9-]{3,48}$/.test(slug)) return NextResponse.json({ error: "Invalid project slug." }, { status: 400 });
    const project = await getProjectBySlug(slug);
    if (!project) return NextResponse.json({ error: "This preview has expired or does not exist." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      project: {
        id: project.id, slug: project.slug, config: project.config, createdAt: project.created_at,
        expiresAt: project.expires_at, publishedAt: project.published_at,
        customDomain: project.domain_verified ? project.custom_domain : null
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load project.";
    return NextResponse.json({ error: message }, { status: message.includes("DATABASE_URL") ? 503 : 500 });
  }
}
