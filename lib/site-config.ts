export const SITE_MODULES = [
  "services",
  "references",
  "contact",
  "cost-estimator",
  "menu",
  "cart",
  "order-status",
  "catalog",
  "configurator",
  "customer-portal",
  "file-upload",
  "booking",
] as const;

export type SiteModule = (typeof SITE_MODULES)[number];
export type SiteIndustry = "handwerk" | "gastro" | "retail" | "service" | "custom";

export type SiteTheme = {
  primary: string;
  background: string;
  foreground: string;
  muted: string;
  radius: "soft" | "rounded" | "compact";
};

export type SiteContact = {
  phone?: string;
  email?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  openingHours?: string[];
};

export type SiteSeo = {
  title: string;
  description: string;
};

export type SiteConfig = {
  id: string;
  slug: string;
  name: string;
  business: string;
  category: string;
  industry: SiteIndustry;
  tagline: string;
  description: string;
  locale: "de-DE";
  theme: SiteTheme;
  contact: SiteContact;
  modules: readonly SiteModule[];
  seo: SiteSeo;
};

const siteRegistry = {
  handwerk: {
    id: "demo-handwerk",
    name: "Handwerk Demo",
    slug: "handwerk",
    business: "Nordwerk Dach & Bau",
    category: "Handwerk",
    industry: "handwerk",
    tagline: "Ein gutes Dach soll vor allem Ruhe geben.",
    description:
      "Sanierung, Reparatur und Ausbau mit verständlichem Ablauf, Referenzen, Kostenrechner und einfacher Anfrage.",
    locale: "de-DE",
    theme: {
      primary: "#d7ff52",
      background: "#f2f0e8",
      foreground: "#10120f",
      muted: "#6b7067",
      radius: "rounded",
    },
    contact: {
      city: "Hildesheim",
      openingHours: ["Mo–Fr 07:00–17:00"],
    },
    modules: ["services", "references", "cost-estimator", "contact", "file-upload"],
    seo: {
      title: "Nordwerk Dach & Bau — Handwerk-Demo",
      description:
        "Beispiel einer modernen Handwerker-Website mit Leistungen, Referenzen, Kostenrechner und digitaler Anfrage.",
    },
  },
  gastro: {
    id: "demo-gastro",
    name: "Lieferdienst Demo",
    slug: "gastro",
    business: "Forno 37",
    category: "Lieferdienst",
    industry: "gastro",
    tagline: "Einfach auswählen. Direkt bestellen.",
    description:
      "Eigene Bestellseite mit Speisekarte, Varianten, Extras, Warenkorb, Lieferung oder Abholung und Bestellstatus.",
    locale: "de-DE",
    theme: {
      primary: "#ff4a25",
      background: "#f7efe5",
      foreground: "#211611",
      muted: "#7b665d",
      radius: "rounded",
    },
    contact: {
      city: "Hildesheim",
      openingHours: ["Di–So 16:00–23:00"],
    },
    modules: ["menu", "cart", "order-status", "contact"],
    seo: {
      title: "Forno 37 — Lieferdienst-Demo",
      description:
        "Beispiel einer Lieferdienst-Website mit Speisekarte, Produktanpassung, Warenkorb und Bestellstatus.",
    },
  },
  blumen: {
    id: "demo-blumen",
    name: "Blumenladen Demo",
    slug: "blumen",
    business: "Blütenliebe",
    category: "Blumenladen",
    industry: "retail",
    tagline: "Blumen, die wirklich zu Ihnen passen.",
    description: "Lokale Floristik mit Sortiment, Strauß-Konfigurator, Preisvorschau und unkomplizierter Anfrage.",
    locale: "de-DE",
    theme: {
      primary: "#ef91aa",
      background: "#f8f2f3",
      foreground: "#271c21",
      muted: "#7d6871",
      radius: "soft",
    },
    contact: {
      street: "Rosenstraße 8",
      postalCode: "31134",
      city: "Hildesheim",
      openingHours: ["Mo–Fr 09:00–18:00", "Sa 09:00–14:00"],
    },
    modules: ["catalog", "configurator", "contact"],
    seo: {
      title: "Blütenliebe — Blumenladen-Demo",
      description: "Beispiel einer modernen Floristik-Website mit Sortiment, Strauß-Konfigurator und lokaler Anfrage.",
    },
  },
} as const satisfies Record<string, SiteConfig>;

export type SiteSlug = keyof typeof siteRegistry;

/** Backwards-compatible export used by demo routes and sitemap generation. */
export const sites = siteRegistry;

export const siteConfigs = Object.values(siteRegistry) as readonly SiteConfig[];

export function isSiteSlug(value: string): value is SiteSlug {
  return Object.prototype.hasOwnProperty.call(siteRegistry, value);
}

export function getSiteConfig(slug: string): SiteConfig | null {
  return isSiteSlug(slug) ? siteRegistry[slug] : null;
}

export function hasSiteModule(site: SiteConfig, module: SiteModule): boolean {
  return site.modules.includes(module);
}

export function validateSiteConfig(site: SiteConfig): string[] {
  const errors: string[] = [];

  if (!site.id.trim()) errors.push("id fehlt");
  if (!/^[a-z0-9-]+$/.test(site.slug)) errors.push("slug ist ungültig");
  if (!site.business.trim()) errors.push("business fehlt");
  if (!site.seo.title.trim()) errors.push("SEO-Titel fehlt");
  if (!site.seo.description.trim()) errors.push("SEO-Beschreibung fehlt");
  if (site.modules.length === 0) errors.push("mindestens ein Modul ist erforderlich");

  const unknownModules = site.modules.filter((module) => !SITE_MODULES.includes(module as SiteModule));
  if (unknownModules.length > 0) errors.push(`unbekannte Module: ${unknownModules.join(", ")}`);

  return errors;
}

export function validateSiteRegistry(): Record<string, string[]> {
  return Object.fromEntries(
    siteConfigs.map((site) => [site.slug, validateSiteConfig(site)] as const).filter(([, errors]) => errors.length > 0),
  );
}
