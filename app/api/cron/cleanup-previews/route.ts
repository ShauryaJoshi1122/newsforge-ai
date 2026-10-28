import { NextResponse } from "next/server";
import { database } from "@/lib/projects";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const sql = database();
    const removed = await sql`DELETE FROM newsforge_projects WHERE expires_at IS NOT NULL AND expires_at <= now()
      AND published_at IS NULL RETURNING id, slug`;
    return NextResponse.json({ ok: true, removedCount: removed.length, removed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cleanup failed.";
    return NextResponse.json({ error: message }, { status: message.includes("DATABASE_URL") ? 503 : 500 });
  }
}
