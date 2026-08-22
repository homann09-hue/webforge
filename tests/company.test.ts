import { describe, expect, it } from "vitest";
import { company, field, isLegalComplete, isRealLegalValue } from "@/lib/company";

describe("field", () => {
  it("marks unfilled placeholders", () => {
    expect(field("TODO")).toBe("[noch einzutragen]");
    expect(field("")).toBe("[noch einzutragen]");
  });

  it("passes real values through", () => {
    expect(field("Musterstraße 1")).toBe("Musterstraße 1");
  });
});

describe("isLegalComplete", () => {
  it("rejects obvious test and template data", () => {
    expect(isRealLegalValue("TODO")).toBe(false);
    expect(isRealLegalValue("Angelo Test")).toBe(false);
    expect(isRealLegalValue("Musterstraße 1")).toBe(false);
    expect(isRealLegalValue("Beispiel GmbH")).toBe(false);
    expect(isRealLegalValue("WebForge GmbH")).toBe(true);
  });

  it("matches the completeness of every required value", () => {
    const required = ["legalName", "representative", "street", "postalCode", "city", "email", "phone"] as const;
    expect(isLegalComplete()).toBe(required.every((key) => isRealLegalValue(company[key])));
  });

  it("requires every legally mandated field", () => {
    const required = ["legalName", "representative", "street", "postalCode", "city", "email", "phone"] as const;
    for (const key of required) {
      expect(typeof company[key]).toBe("string");
    }
  });
});
