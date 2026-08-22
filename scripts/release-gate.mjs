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
for (const field of requiredCompanyFields) {
  const match = company.match(new RegExp(`${field}:\\s*["']([^"']*)["']`));
  const value = match?.[1]?.trim() ?? "";
  if (!value || value === "TODO") blockers.push(`LEGAL  ${field} ist noch nicht vollständig`);
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
if (!blockers.some((item) => item.startsWith("DOKU"))) checks.push("OK  README beschreibt Neon/Vercel als aktive Architektur");

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

console.log("\nWebForge Release Gate\n=====================");
for (const line of checks) console.log(line);

if (blockers.length > 0) {
  console.error("\nBLOCKER\n-------");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  console.error(`\nRelease nicht freigegeben: ${blockers.length} Blocker.`);
  process.exit(1);
}

console.log("\nRelease-Gate grün. Technische Marktreife-Freigabe kann erfolgen.");
