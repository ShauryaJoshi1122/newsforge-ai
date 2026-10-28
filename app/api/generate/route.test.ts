import { describe, expect, it } from "vitest";
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
