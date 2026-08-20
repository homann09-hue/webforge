import { describe, expect, it } from "vitest";
import { clientIpFrom, isAdminSessionToken, isValidEmail, validateLeadInput } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("name@unternehmen.de")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const value of ["", "name", "name@", "@domain.de", "name@domain", "a b@domain.de"]) {
      expect(isValidEmail(value)).toBe(false);
    }
  });

  it("rejects addresses over the RFC length limit", () => {
    expect(isValidEmail(`${"a".repeat(250)}@b.de`)).toBe(false);
  });
});

describe("validateLeadInput", () => {
  const valid = { company: "Mustermann GmbH", email: "Info@Mustermann.DE", website: "mustermann.de" };

  it("accepts a valid submission and normalises the email", () => {
    const result = validateLeadInput(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.email).toBe("info@mustermann.de");
  });

  it("trims surrounding whitespace", () => {
    const result = validateLeadInput({ ...valid, company: "  Mustermann GmbH  " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.company).toBe("Mustermann GmbH");
  });

  it("rejects a too short or too long company name", () => {
    expect(validateLeadInput({ ...valid, company: "A" }).ok).toBe(false);
    expect(validateLeadInput({ ...valid, company: "A".repeat(121) }).ok).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(validateLeadInput({ ...valid, email: "nope" }).ok).toBe(false);
  });

  it("rejects an over-long website", () => {
    expect(validateLeadInput({ ...valid, website: "x".repeat(301) }).ok).toBe(false);
  });

  it("flags a tripped honeypot", () => {
    const result = validateLeadInput({ ...valid, website_url: "http://spam.example" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("SPAM");
  });

  it("ignores an empty honeypot", () => {
    expect(validateLeadInput({ ...valid, website_url: "" }).ok).toBe(true);
  });

  it("tolerates missing fields instead of throwing", () => {
    expect(validateLeadInput({}).ok).toBe(false);
  });
});

describe("isAdminSessionToken", () => {
  it("accepts a well formed token", () => {
    expect(isAdminSessionToken(`wfs_${"a".repeat(64)}`)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAdminSessionToken(`wfs_${"a".repeat(63)}`)).toBe(false);
    expect(isAdminSessionToken(`wfs_${"A".repeat(64)}`)).toBe(false);
    expect(isAdminSessionToken("hunter2")).toBe(false);
    expect(isAdminSessionToken("")).toBe(false);
    expect(isAdminSessionToken(undefined)).toBe(false);
  });
});

describe("clientIpFrom", () => {
  it("takes the left-most entry of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" });
    expect(clientIpFrom(headers)).toBe("203.0.113.7");
  });

  it("handles a single address", () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to the other proxy headers", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIpFrom(new Headers({ "cf-connecting-ip": "203.0.113.10" }))).toBe("203.0.113.10");
  });

  it("prefers x-forwarded-for over the fallbacks", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "10.0.0.1" });
    expect(clientIpFrom(headers)).toBe("203.0.113.7");
  });

  it("returns null when no address is present", () => {
    expect(clientIpFrom(new Headers())).toBeNull();
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "  " }))).toBeNull();
  });
});
