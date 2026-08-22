import type { SiteConfig, SiteIndustry, SiteModule, SiteTheme } from "./site-config";
import { SITE_MODULES, validateSiteConfig } from "./site-config";

export type CustomerSiteInput = {
  id: string;
  slug: string;
  business: string;
  category: string;
  industry: SiteIndustry;
  tagline: string;
  description: string;
  contact?: SiteConfig["contact"];
  theme?: Partial<SiteTheme>;
  modules?: readonly SiteModule[];
  seo?: Partial<SiteConfig["seo"]>;
};

const industryDefaults: Record<SiteIndustry, Pick<SiteConfig, "theme" | "modules">> = {
  handwerk: {
    theme: {
      primary: "#d7ff52",
      background: "#f2f0e8",
      foreground: "#10120f",
      muted: "#6b7067",
      radius: "rounded",
    },
    modules: ["services", "references", "cost-estimator", "contact", "file-upload"],
  },
  gastro: {
    theme: {
      primary: "#ff4a25",
      background: "#f7efe5",
      foreground: "#211611",
      muted: "#7b665d",
      radius: "rounded",
    },
    modules: ["menu", "cart", "order-status", "contact"],
  },
  retail: {
    theme: {
      primary: "#ef91aa",
      background: "#f8f2f3",
      foreground: "#271c21",
      muted: "#7d6871",
      radius: "soft",
    },
    modules: ["catalog", "configurator", "contact"],
  },
  service: {
    theme: {
      primary: "#c9ff4b",
      background: "#f7f7f3",
      foreground: "#11151a",
      muted: "#68717b",
      radius: "rounded",
    },
    modules: ["services", "references", "contact", "booking"],
  },
  custom: {
    theme: {
      primary: "#c9ff4b",
      background: "#ffffff",
      foreground: "#111111",
      muted: "#666666",
      radius: "rounded",
    },
    modules: ["services", "contact"],
  },
};

export function getIndustryDefaults(industry: SiteIndustry) {
  return industryDefaults[industry];
}

export function createCustomerSite(input: CustomerSiteInput): SiteConfig {
  const defaults = getIndustryDefaults(input.industry);
  const modules = input.modules ?? defaults.modules;

  const site: SiteConfig = {
    id: input.id,
    slug: input.slug,
    name: `${input.business} Website`,
    business: input.business,
    category: input.category,
    industry: input.industry,
    tagline: input.tagline,
    description: input.description,
    locale: "de-DE",
    theme: { ...defaults.theme, ...input.theme },
    contact: input.contact ?? {},
    modules,
    seo: {
      title: input.seo?.title ?? `${input.business} — ${input.category}`,
      description: input.seo?.description ?? input.description,
    },
  };

  const errors = validateSiteConfig(site);
  if (errors.length > 0) {
    throw new Error(`Ungültige SiteConfig für ${input.slug}: ${errors.join("; ")}`);
  }

  return site;
}

export type SiteModuleDefinition = {
  id: SiteModule;
  label: string;
  customerValue: string;
  industries: readonly SiteIndustry[];
};

export const moduleCatalog: readonly SiteModuleDefinition[] = [
  {
    id: "services",
    label: "Leistungen",
    customerValue: "Leistungen verständlich darstellen",
    industries: ["handwerk", "service", "custom"],
  },
  {
    id: "references",
    label: "Referenzen",
    customerValue: "Vertrauen durch echte Arbeiten und Projekte",
    industries: ["handwerk", "service", "custom"],
  },
  {
    id: "contact",
    label: "Anfrage",
    customerValue: "Interessenten schnell zur Anfrage führen",
    industries: ["handwerk", "gastro", "retail", "service", "custom"],
  },
  {
    id: "cost-estimator",
    label: "Kostenrechner",
    customerValue: "Eine erste Preisorientierung geben",
    industries: ["handwerk", "service"],
  },
  { id: "menu", label: "Speisekarte", customerValue: "Gerichte und Preise direkt zeigen", industries: ["gastro"] },
  {
    id: "cart",
    label: "Warenkorb",
    customerValue: "Direkte Bestellungen ermöglichen",
    industries: ["gastro", "retail"],
  },
  {
    id: "order-status",
    label: "Bestellstatus",
    customerValue: "Kunden über den Fortschritt informieren",
    industries: ["gastro", "retail"],
  },
  { id: "catalog", label: "Sortiment", customerValue: "Produkte übersichtlich präsentieren", industries: ["retail"] },
  {
    id: "configurator",
    label: "Konfigurator",
    customerValue: "Produkte oder Leistungen individuell zusammenstellen",
    industries: ["retail", "service", "custom"],
  },
  {
    id: "customer-portal",
    label: "Kundenbereich",
    customerValue: "Projekte, Dateien und Status zentral bereitstellen",
    industries: ["handwerk", "service", "custom"],
  },
  {
    id: "file-upload",
    label: "Datei-Upload",
    customerValue: "Fotos und Unterlagen direkt vom Kunden erhalten",
    industries: ["handwerk", "service", "custom"],
  },
  {
    id: "booking",
    label: "Terminbuchung",
    customerValue: "Termine ohne Telefon abstimmen",
    industries: ["service", "custom"],
  },
];

export function getAvailableModules(industry: SiteIndustry): SiteModuleDefinition[] {
  return moduleCatalog.filter((module) => module.industries.includes(industry));
}

export function assertKnownModules(modules: readonly string[]): asserts modules is readonly SiteModule[] {
  const unknown = modules.filter((module) => !SITE_MODULES.includes(module as SiteModule));
  if (unknown.length > 0) throw new Error(`Unbekannte Module: ${unknown.join(", ")}`);
}
