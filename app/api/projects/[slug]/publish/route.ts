import { NextResponse } from "next/server";
import { authorizedProject, database } from "@/lib/projects";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const project = await authorizedProject(slug, request);
    if (!project) return NextResponse.json({ error: "Management token is missing or invalid. Save the project again in this browser to get a new management link." }, { status: 401 });
    const sql = database();
    const rows = await sql`UPDATE newsforge_projects SET expires_at = NULL, published_at = COALESCE(published_at, now())
      WHERE id = ${project.id} RETURNING id, slug, published_at, custom_domain, domain_verified`;
    const updated = rows[0] as { id: string; slug: string; published_at: string; custom_domain: string | null; domain_verified: boolean };
    return NextResponse.json({ ok: true, project: updated, message: "Expiry disabled. This project remains hosted on NewsForge until you remove it." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not publish project.";
    return NextResponse.json({ error: message }, { status: message.includes("DATABASE_URL") ? 503 : 500 });
  }
}
