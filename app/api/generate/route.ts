import { NextResponse } from "next/server";
import { templates } from "@/lib/templates";
const hexColor = /^#[0-9a-fA-F]{6}$/;
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const siteName = typeof body.siteName === "string" ? body.siteName.trim().slice(0, 80) : "";
    const templateId = typeof body.templateId === "string" ? body.templateId : "";
    const language = ["en", "gu", "hi"].includes(body.language) ? body.language : "en";
    const template = templates.find((item) => item.id === templateId);
    const primaryColor = typeof body.primaryColor === "string" && hexColor.test(body.primaryColor) ? body.primaryColor : (template?.accent ?? "#16845b");
    if (!siteName) return NextResponse.json({ error: "Enter a website or news brand name." }, { status: 400 });
    if (!template) return NextResponse.json({ error: "Choose a valid template." }, { status: 400 });
    const allowed = ["breaking-ticker", "live-tv", "ad-slots", "social-links"];
    const defaultCategories = ["Latest", "Local", "India", "World", "Politics", "Sports", "Business", "Entertainment"];
    const requestedCategories = Array.isArray(body.categories) ? body.categories : defaultCategories;
    const categories = [...new Set(requestedCategories.filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.trim().replace(/\\s+/g, " ").slice(0, 24)).filter((item: string) => item.length > 0).map((item: string) => item.slice(0, 24)))].slice(0, 12);
    const config = { version: 1, siteName, language, templateId: template.id, templateName: template.name, branding: { primaryColor, backgroundColor: "#ffffff", textColor: "#15202b" }, features: Array.isArray(body.features) ? body.features.filter((x: unknown) => typeof x === "string" && allowed.includes(x)).slice(0, 4) : ["breaking-ticker"], categories: categories.length ? categories : defaultCategories, pages: ["Home", "About", "Contact", "Privacy Policy"], generatedAt: new Date().toISOString() };
    return NextResponse.json({ ok: true, config, message: "Website configuration generated. Connect WordPress to publish it to a real site." });
  } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
}
