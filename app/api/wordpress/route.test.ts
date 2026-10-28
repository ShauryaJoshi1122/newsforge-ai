import { describe, expect, it } from "vitest";
import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/wordpress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/wordpress", () => {
  it("rejects non-HTTPS WordPress URLs before network access", async () => {
    const response = await POST(request({
      siteUrl: "http://example.com", username: "editor", appPassword: "not-a-real-password"
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("HTTPS")
    });
  });

  it("requires an application password", async () => {
    const response = await POST(request({
      siteUrl: "https://example.com", username: "editor", appPassword: ""
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Application Password")
    });
  });

  it("rejects localhost targets to reduce server-side request forgery risk", async () => {
    const response = await POST(request({
      siteUrl: "https://localhost", username: "editor", appPassword: "not-a-real-password"
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("public IP")
    });
  });

  it("requires a brand name for publishing", async () => {
    const response = await POST(request({
      action: "publish", siteUrl: "https://example.com", username: "editor", appPassword: "not-a-real-password"
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("brand name")
    });
  });
});
