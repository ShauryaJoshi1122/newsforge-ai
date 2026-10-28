import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/generate", () => {
  it("rejects a missing brand name", async () => {
    const response = await POST(request({ templateId: "broadcast" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("brand name") });
  });

  it("rejects an unknown template", async () => {
    const response = await POST(request({ siteName: "Example News", templateId: "not-a-template" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("template") });
  });

  it("returns a normalized configuration and filters unsupported features", async () => {
    const response = await POST(request({
      siteName: "  Gujarat News  ", language: "gu", templateId: "broadcast",
      primaryColor: "#12abef", features: ["live-tv", "unknown-feature", "breaking-ticker"]
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.config).toMatchObject({
      siteName: "Gujarat News", language: "gu", templateId: "broadcast",
      branding: { primaryColor: "#12abef" },
      features: ["live-tv", "breaking-ticker"]
    });
    expect(body.config.categories).toContain("Politics");
    expect(Number.isNaN(Date.parse(body.config.generatedAt))).toBe(false);
  });

  it("keeps sanitized custom categories in the generated configuration", async () => {
    const response = await POST(request({
      siteName: "Regional Daily", templateId: "regional-connect",
      categories: ["  Gujarat  ", "Education News", "", 42, "education news", "A".repeat(40)]
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.config.categories).toEqual(["Gujarat", "Education News", "A".repeat(24)]);
  });

  it("sanitizes editable homepage copy and applies character limits", async () => {
    const response = await POST(request({
      siteName: "Regional Daily", templateId: "regional-connect", language: "en",
      homepage: {
        headline: "  Local   headlines  ",
        description: "  Community   news for everyone  ",
        tickerText: "  Breaking   update  "
      }
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.config.homepage).toEqual({
      headline: "Local headlines",
      description: "Community news for everyone",
      tickerText: "Breaking update"
    });

    const longResponse = await POST(request({
      siteName: "Regional Daily", templateId: "regional-connect",
      homepage: { headline: "H".repeat(200), description: "D".repeat(300), tickerText: "T".repeat(220) }
    }));
    const longBody = await longResponse.json();
    expect(longBody.config.homepage.headline).toHaveLength(160);
    expect(longBody.config.homepage.description).toHaveLength(240);
    expect(longBody.config.homepage.tickerText).toHaveLength(180);
  });

  it("falls back to safe defaults for unsupported language and color", async () => {
    const response = await POST(request({
      siteName: "Regional Daily", language: "xx", templateId: "regional-connect", primaryColor: "red"
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.config.language).toBe("en");
    expect(body.config.branding.primaryColor).toBe("#16845b");
  });
});


describe("Gemini-backed AI generation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const base = {
    siteName: "Patan News", language: "gu", templateId: "regional-connect",
    primaryColor: "#16845b", categories: ["Gujarat", "Local"],
    features: ["breaking-ticker"],
    homepage: { headline: "પાટણના સમાચાર", description: "સ્થાનિક સમાચાર", tickerText: "તાજા સમાચાર" }
  };

  it("returns a clear setup error when AI is requested without a Gemini key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const response = await POST(request({ ...base, prompt: "Design a modern Gujarati newsroom" }));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).toContain("GEMINI_API_KEY");
  });

  it("uses only supported AI design fields and preserves the template-only route", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({
        templateId: "business-desk", primaryColor: "#123456",
        categories: ["Business", "Markets"],
        features: ["breaking-ticker", "unknown-feature"],
        homepage: { headline: "Business news", description: "Clear analysis", tickerText: "Market update" },
        injectedHtml: "<script>alert(1)</script>"
      }) }] }]
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const response = await POST(request({ ...base, prompt: "Create a business news website" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.mode).toBe("ai");
    expect(body.config.templateId).toBe("business-desk");
    expect(body.config.branding.primaryColor).toBe("#123456");
    expect(body.config.features).toEqual(["breaking-ticker"]);
    expect(body.config.injectedHtml).toBeUndefined();
  });
});
