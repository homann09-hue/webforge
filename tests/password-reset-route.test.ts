import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/admin/password-reset/route";

const token = `wfr_${"a".repeat(64)}`;

describe("password reset route", () => {
  it("rejects malformed reset links without caching", async () => {
    const response = await GET(new Request("https://example.test/api/admin/password-reset?token=invalid"));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toContain("ungültig");
  });

  it("renders a secure one-time password form", async () => {
    const response = await GET(new Request(`https://example.test/api/admin/password-reset?token=${token}`));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(html).toContain('autocomplete="new-password"');
    expect(html).toContain(`value="${token}"`);
  });

  it("rejects mismatching passwords before database access", async () => {
    const form = new FormData();
    form.set("token", token);
    form.set("password", "different-password-one");
    form.set("confirmation", "different-password-two");
    const response = await POST(
      new Request("https://example.test/api/admin/password-reset", { method: "POST", body: form }),
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("stimmen nicht überein");
  });
});
