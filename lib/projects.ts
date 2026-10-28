import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { templates } from "@/lib/templates";

export type WebsiteConfig = {
  version?: number;
  siteName: string;
  language: string;
  templateId: string;
  templateName?: string;
  branding: { primaryColor: string };
  features: string[];
  categories: string[];
  homepage: { headline: string; description: string; tickerText: string };
  pages?: string[];
  generatedAt?: string;
};

export type StoredProject = {
  id: string;
  slug: string;
  config: WebsiteConfig;
  created_at: string;
  expires_at: string | null;
  published_at: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
};

export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured. Add a Neon Postgres connection string and run database/schema.sql.");
  return neon(process.env.DATABASE_URL);
}

export function normalizeConfig(value: unknown): WebsiteConfig | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const siteName = typeof input.siteName === "string" ? input.siteName.trim().slice(0, 80) : "";
  const templateId = typeof input.templateId === "string" ? input.templateId : "";
  const template = templates.find((item) => item.id === templateId);
  const language = typeof input.language === "string" && ["en", "gu", "hi"].includes(input.language) ? input.language : "en";
  const branding = input.branding && typeof input.branding === "object" ? input.branding as Record<string, unknown> : {};
  const primaryColor = typeof branding.primaryColor === "string" && /^#[0-9a-fA-F]{6}$/.test(branding.primaryColor) ? branding.primaryColor : (template?.accent ?? "#16845b");
  if (!siteName || !template) return null;
  const rawFeatures = Array.isArray(input.features) ? input.features : [];
  const allowedFeatures = ["breaking-ticker", "live-tv", "ad-slots", "social-links"];
  const features = rawFeatures.filter((x): x is string => typeof x === "string" && allowedFeatures.includes(x)).slice(0, 4);
  const rawCategories = Array.isArray(input.categories) ? input.categories : [];
  const categories: string[] = [];
  for (const item of rawCategories) {
    if (typeof item !== "string") continue;
    const name = item.trim().replace(/\s+/g, " ").slice(0, 24);
    if (name && !categories.some((existing) => existing.toLowerCase() === name.toLowerCase())) categories.push(name);
    if (categories.length >= 12) break;
  }
  const rawHomepage = input.homepage && typeof input.homepage === "object" ? input.homepage as Record<string, unknown> : {};
  const clean = (v: unknown, max: number) => typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
  return {
    version: 1, siteName, language, templateId, templateName: template.name,
    branding: { primaryColor }, features,
    categories: categories.length ? categories : ["Latest", "Local", "India", "World"],
    homepage: {
      headline: clean(rawHomepage.headline, 160),
      description: clean(rawHomepage.description, 240),
      tickerText: clean(rawHomepage.tickerText, 180)
    },
    pages: ["Home", "About", "Contact", "Privacy Policy"],
    generatedAt: typeof input.generatedAt === "string" ? input.generatedAt.slice(0, 40) : new Date().toISOString()
  };
}

export function managementTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, storedHash: string) {
  const actual = Buffer.from(managementTokenHash(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function makeSlug(siteName: string) {
  const name = siteName.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "news-site";
  return name + "-" + randomBytes(3).toString("hex");
}

export async function createStoredProject(config: WebsiteConfig) {
  const sql = database();
  const managementToken = randomBytes(32).toString("base64url");
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = makeSlug(config.siteName);
    try {
      const rows = await sql`INSERT INTO newsforge_projects (slug, config, management_token_hash, expires_at)
        VALUES (${slug}, ${JSON.stringify(config)}::jsonb, ${managementTokenHash(managementToken)}, now() + interval '24 hours')
        RETURNING id, slug, config, created_at, expires_at, published_at, custom_domain, domain_verified`;
      return { project: rows[0] as unknown as StoredProject, managementToken };
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
  throw new Error("Could not reserve a unique preview slug. Please retry.");
}

export async function getProjectBySlug(slug: string): Promise<StoredProject | null> {
  const sql = database();
  const rows = await sql`SELECT id, slug, config, created_at, expires_at, published_at, custom_domain, domain_verified
    FROM newsforge_projects WHERE slug = ${slug} AND (expires_at IS NULL OR expires_at > now()) LIMIT 1`;
  return (rows[0] as unknown as StoredProject) || null;
}

export async function getProjectByDomain(domain: string): Promise<StoredProject | null> {
  const sql = database();
  const normalized = domain.toLowerCase().replace(/\.$/, "");
  const rows = await sql`SELECT id, slug, config, created_at, expires_at, published_at, custom_domain, domain_verified
    FROM newsforge_projects WHERE lower(custom_domain) = ${normalized} AND domain_verified = true
    AND (expires_at IS NULL OR expires_at > now()) LIMIT 1`;
  return (rows[0] as unknown as StoredProject) || null;
}

export async function authorizedProject(slug: string, request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return null;
  const sql = database();
  const rows = await sql`SELECT id, slug, config, created_at, expires_at, published_at, custom_domain, domain_verified, management_token_hash
    FROM newsforge_projects WHERE slug = ${slug} LIMIT 1`;
  const row = rows[0] as (StoredProject & { management_token_hash: string }) | undefined;
  if (!row || !verifyToken(token, row.management_token_hash)) return null;
  return row;
}
