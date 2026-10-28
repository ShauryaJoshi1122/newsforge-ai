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
    const categories: string[] = [];
    for (const item of requestedCategories) {
      if (typeof item !== "string") continue;
      const normalized = item.trim().replace(/\s+/g, " ").slice(0, 24);
      if (!normalized || categories.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) continue;
      categories.push(normalized);
      if (categories.length === 12) break;
    }
    const requestedHomepage = body.homepage && typeof body.homepage === "object" ? body.homepage : {};
    const cleanText = (value: unknown, fallback: string, maxLength: number) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : fallback;
    const homepageDefaults = language === "gu"
      ? { headline: "ગુજરાત અને દેશના તાજા સમાચાર એક જ જગ્યાએ", description: "તમારી બ્રાન્ડ, તમારી ભાષા અને તમારા વાચકો માટે બનાવેલી ન્યૂઝ વેબસાઇટ.", tickerText: "તાજા સમાચાર માટે તમારી વેબસાઇટ તૈયાર છે" }
      : language === "hi"
        ? { headline: "देश और दुनिया की ताज़ा खबरें, एक ही जगह", description: "आपके ब्रांड और पाठकों के लिए बनाई गई आधुनिक न्यूज़ वेबसाइट।", tickerText: "ताज़ा खबरों के लिए आपकी वेबसाइट तैयार है" }
        : { headline: "The latest stories that matter to your community", description: "A modern news experience designed around your brand and your readers.", tickerText: "Your breaking news ticker will appear here" };
    const homepage = {
      headline: cleanText(requestedHomepage.headline, homepageDefaults.headline, 160) || homepageDefaults.headline,
      description: cleanText(requestedHomepage.description, homepageDefaults.description, 240) || homepageDefaults.description,
      tickerText: cleanText(requestedHomepage.tickerText, homepageDefaults.tickerText, 180) || homepageDefaults.tickerText
    };
    const config = { version: 1, siteName, language, templateId: template.id, templateName: template.name, branding: { primaryColor, backgroundColor: "#ffffff", textColor: "#15202b" }, features: Array.isArray(body.features) ? body.features.filter((x: unknown) => typeof x === "string" && allowed.includes(x)).slice(0, 4) : ["breaking-ticker"], categories: categories.length ? categories : defaultCategories, homepage, pages: ["Home", "About", "Contact", "Privacy Policy"], generatedAt: new Date().toISOString() };
    return NextResponse.json({ ok: true, config, message: "Website configuration generated. Connect WordPress to publish it to a real site." });
  } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
}
