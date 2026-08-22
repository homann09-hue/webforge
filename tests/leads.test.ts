import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFunctionFetchMock } = vi.hoisted(() => ({
  backendFunctionFetchMock: vi.fn(),
}));

vi.mock("@/lib/backend-transport", () => ({
  backendFunctionFetch: backendFunctionFetchMock,
}));

import { createLead, LeadRateLimitError } from "@/lib/leads";

describe("createLead", () => {
  beforeEach(() => backendFunctionFetchMock.mockReset());

  it("preserves backend rate limiting as a typed error", async () => {
    backendFunctionFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "rate_limited" }), { status: 429 }),
    );

    await expect(createLead({ company: "Mustermann GmbH", email: "info@mustermann.de" })).rejects.toBeInstanceOf(
      LeadRateLimitError,
    );
  });

  it("keeps other backend failures generic", async () => {
    backendFunctionFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "backend_failed" }), { status: 500 }),
    );

    await expect(createLead({ company: "Mustermann GmbH", email: "info@mustermann.de" })).rejects.toThrow(
      "backend_failed",
    );
  });
});
