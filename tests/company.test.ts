import { describe, expect, it } from "vitest";
import { company, field, isLegalComplete } from "@/lib/company";

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
  it("is false while the imprint still carries placeholders", () => {
    // This guards the checkout links on the pricing page. If someone fills in
    // lib/company.ts this flips to true and the test below takes over.
    const stillPlaceholder = company.legalName === "TODO";
    expect(isLegalComplete()).toBe(!stillPlaceholder);
  });

  it("requires every legally mandated field", () => {
    const required = ["legalName", "representative", "street", "postalCode", "city", "email", "phone"] as const;
    for (const key of required) {
      expect(typeof company[key]).toBe("string");
    }
  });
});
