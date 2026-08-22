import { describe, expect, it } from "vitest";
import { createCustomerSite, getAvailableModules } from "../lib/site-engine";
import { getSiteConfig, hasSiteModule, validateSiteRegistry } from "../lib/site-config";

describe("customer site engine", () => {
  it("keeps the built-in demo registry valid", () => {
    expect(validateSiteRegistry()).toEqual({});
    expect(getSiteConfig("handwerk")?.business).toBe("Nordwerk Dach & Bau");
    expect(getSiteConfig("unknown")).toBeNull();
  });

  it("creates a customer site from industry defaults", () => {
    const site = createCustomerSite({
      id: "kunde-mueller",
      slug: "mueller-dach",
      business: "Müller Dach GmbH",
      category: "Dachdecker",
      industry: "handwerk",
      tagline: "Ihr Dach in guten Händen.",
      description: "Dachsanierung und Reparatur in der Region.",
      contact: { city: "Hildesheim", email: "info@example.de" },
    });

    expect(site.theme.primary).toBe("#d7ff52");
    expect(hasSiteModule(site, "cost-estimator")).toBe(true);
    expect(hasSiteModule(site, "menu")).toBe(false);
    expect(site.seo.title).toContain("Müller Dach GmbH");
  });

  it("allows explicit modules and theme overrides", () => {
    const site = createCustomerSite({
      id: "kunde-beratung",
      slug: "beratung-nord",
      business: "Beratung Nord",
      category: "Beratung",
      industry: "service",
      tagline: "Einfach beraten lassen.",
      description: "Persönliche Beratung mit direkter Terminbuchung.",
      modules: ["services", "booking", "contact"],
      theme: { primary: "#123456" },
    });

    expect(site.modules).toEqual(["services", "booking", "contact"]);
    expect(site.theme.primary).toBe("#123456");
  });

  it("exposes only modules relevant to an industry", () => {
    const gastro = getAvailableModules("gastro").map((module) => module.id);
    expect(gastro).toContain("menu");
    expect(gastro).toContain("cart");
    expect(gastro).not.toContain("cost-estimator");
  });

  it("rejects invalid slugs", () => {
    expect(() =>
      createCustomerSite({
        id: "bad",
        slug: "Ungültiger Slug",
        business: "Test",
        category: "Test",
        industry: "custom",
        tagline: "Test",
        description: "Test",
      }),
    ).toThrow(/slug ist ungültig/);
  });
});
