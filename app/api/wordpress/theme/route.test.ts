import { describe, expect, it } from "vitest";
import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/wordpress/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

const config = {
  siteName: "Gujarati News",
  language: "gu",
  templateId: "regional-connect",
  templateName: "Regional Connect",
  branding: { primaryColor: "#16845b" },
  features: ["breaking-ticker", "live-tv", "invalid-feature"],
  categories: ["Gujarat", "Local", "India"],
  homepage: {
    headline: "ગુજરાતના તાજા સમાચાર",
    description: "તમારા વિસ્તારના સમાચાર",
    tickerText: "તાજા સમાચાર"
  }
};

describe("POST /api/wordpress/theme", () => {
  it("rejects an invalid or missing configuration", async () => {
    const response = await POST(request({ config: { siteName: "", language: "gu" } }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("returns a ZIP archive for a valid WordPress theme configuration", async () => {
    const response = await POST(request({ config }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toContain("wordpress-theme.zip");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(1000);
    // ZIP local-file header signature: PK\u0003\u0004
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
