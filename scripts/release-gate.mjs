import { access, readFile } from "node:fs/promises";

const checks = [];
const blockers = [];

async function requireFile(path, label) {
  try {
    await access(path);
    checks.push(`OK  ${label}`);
  } catch {
    blockers.push(`FEHLT  ${label}: ${path}`);
  }
}

for (const [path, label] of [
  ["lib/site-config.ts", "Customer Site Config"],
  ["lib/site-engine.ts", "Customer Site Engine"],
  ["components/customer-site.tsx", "generischer Site Renderer"],
  ["lib/onboarding.ts", "Onboarding-Gates"],
  ["lib/authorization.ts", "Rollen-/Berechtigungsmodell"],
  ["migration/neon/001_multi_user_auth.sql", "Multi-User Neon-Migration"],
  ["app/api/stripe/webhook/route.ts", "Stripe Webhook Route"],
  ["lib/company.ts", "öffentliche Firmendaten"],
  ["app/impressum/page.tsx", "Impressum"],
  ["app/datenschutz/page.tsx", "Datenschutz"],
]) {
  await requireFile(path, label);
}

const company = await readFile("lib/company.ts", "utf8");
const requiredCompanyFields = ["legalName", "representative", "street", "postalCode", "city", "email", "phone"];
const placeholderPattern = /\b(todo|test|muster|beispiel)|\[noch einzutragen\]/i;
for (const field of requiredCompanyFields) {
  const match = company.match(new RegExp(`${field}:\\s*["']([^"']*)["']`));
  const value = match?.[1]?.trim() ?? "";
  if (!value || placeholderPattern.test(value)) blockers.push(`LEGAL  ${field} ist noch nicht mit Echtdaten belegt`);
}
if (!blockers.some((item) => item.startsWith("LEGAL"))) checks.push("OK  Pflicht-Firmendaten vollständig");

const readme = await readFile("README.md", "utf8");
for (const stale of [
  "Supabase (Postgres, Edge Functions, Storage)",
  "Browser → Next Route Handler (Validierung) → Supabase Edge Function",
  "Stripe-Webhook-Endpunkt auf die Edge Function",
]) {
  if (readme.includes(stale)) blockers.push(`DOKU  veraltete aktive Supabase-Angabe: ${stale}`);
}
if (!blockers.some((item) => item.startsWith("DOKU")))
  checks.push("OK  README beschreibt Neon/Vercel als aktive Architektur");

const siteConfig = await readFile("lib/site-config.ts", "utf8");
for (const invariant of ["SITE_MODULES", "validateSiteRegistry", "getSiteConfig"]) {
  if (!siteConfig.includes(invariant)) blockers.push(`ENGINE  Site Config fehlt Invariante ${invariant}`);
}

const onboarding = await readFile("lib/onboarding.ts", "utf8");
for (const invariant of ["canStartBuild", "canLaunch", "launch-approved", "offer-accepted"]) {
  if (!onboarding.includes(invariant)) blockers.push(`ONBOARDING  fehlt ${invariant}`);
}

const authorization = await readFile("lib/authorization.ts", "utf8");
for (const role of ["owner", "admin", "staff", "customer"]) {
  if (!authorization.includes(`"${role}"`)) blockers.push(`AUTH  Rolle fehlt: ${role}`);
}

if (/smallBusiness:\s*true/.test(company)) {
  const [offerRoute, invoiceRoute, adminPage, invoicePage, printTemplate] = await Promise.all([
    readFile("app/api/admin/offers/route.ts", "utf8"),
    readFile("app/api/admin/invoices/route.ts", "utf8"),
    readFile("app/admin/page.tsx", "utf8"),
    readFile("app/admin/invoices/page.tsx", "utf8"),
    readFile("lib/print-template.ts", "utf8"),
  ]);

  if (!offerRoute.includes("company.smallBusiness ? 0"))
    blockers.push("TAX  Angebots-API erzwingt bei §19 UStG nicht 0 % Umsatzsteuer");
  if (!invoiceRoute.includes("company.smallBusiness ? 0"))
    blockers.push("TAX  Rechnungs-API erzwingt bei §19 UStG nicht 0 % Umsatzsteuer");
  if (!adminPage.includes('company.smallBusiness ? "0" : "19"'))
    blockers.push("TAX  Angebotsmaske nutzt nicht den Kleinunternehmer-Standard");
  if (!invoicePage.includes('company.smallBusiness ? "0" : "19"'))
    blockers.push("TAX  Rechnungsmaske nutzt nicht den Kleinunternehmer-Standard");
  if (!printTemplate.includes("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."))
    blockers.push("TAX  Druckvorlage enthält keinen §19-UStG-Hinweis");

  if (!blockers.some((item) => item.startsWith("TAX"))) checks.push("OK  §19-UStG-Regeln technisch abgesichert");
}

console.log("\nWebForge Release Gate\n=====================");
for (const line of checks) console.log(line);

if (blockers.length > 0) {
  console.error("\nBLOCKER\n-------");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  console.error(`\nRelease nicht freigegeben: ${blockers.length} Blocker.`);
  process.exit(1);
}

console.log("\nRelease-Gate grün. Technische Marktreife-Freigabe kann erfolgen.");
