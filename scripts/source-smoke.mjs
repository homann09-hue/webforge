import { access, readFile } from "node:fs/promises";

const required = [
  "app/page.tsx",
  "app/demo/[slug]/page.tsx",
  "app/sites/[slug]/page.tsx",
  "components/demo-handwerk.tsx",
  "components/demo-gastro.tsx",
  "components/demo-blumen.tsx",
  "components/customer-site.tsx",
  "lib/site-config.ts",
  "lib/site-engine.ts",
  "lib/onboarding.ts",
  "lib/authorization.ts",
  "lib/admin-rpc.ts",
  "lib/admin-session.ts",
  "lib/admin-client.ts",
  "lib/company.ts",
  "lib/money.ts",
  "app/admin/layout.tsx",
  "app/api/admin/session/route.ts",
  "app/api/admin/password-reset/route.ts",
  "app/api/stripe/webhook/route.ts",
  "migration/neon/001_multi_user_auth.sql",
  "migration/neon/002_multi_user_admin_bridge.sql",
  "migration/neon/003_password_reset_links.sql",
  "scripts/provision-neon-user.mjs",
  "scripts/open-password-reset.mjs",
  "next.config.ts",
];
for (const file of required) await access(file);

const demoRouter = await readFile("app/demo/[slug]/page.tsx", "utf8");
if (!demoRouter.includes("siteConfigs.map") || !demoRouter.includes("getSiteConfig")) {
  throw new Error("Demo router must be driven by the central SiteConfig registry");
}

const siteConfigSource = await readFile("lib/site-config.ts", "utf8");
for (const slug of ["handwerk", "gastro", "blumen"]) {
  if (!new RegExp(`\\b${slug}:\\s*{`).test(siteConfigSource)) {
    throw new Error(`Missing demo SiteConfig: ${slug}`);
  }
}
for (const invariant of ["SITE_MODULES", "validateSiteRegistry", "getSiteConfig", "hasSiteModule"]) {
  if (!siteConfigSource.includes(invariant)) throw new Error(`SiteConfig engine missing invariant: ${invariant}`);
}

const envExample = await readFile(".env.example", "utf8");
for (const name of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]) {
  const line = envExample.split(/\r?\n/).find((value) => value.startsWith(`${name}=`));
  if (!line || line !== `${name}=`) throw new Error(`${name} must remain blank in .env.example`);
}
if (envExample.includes("NEXT_PUBLIC_LEGAL_COMPLETE")) {
  throw new Error("Legal completeness must not have a deployment-time bypass");
}

const noSupabaseRuntimeFiles = [
  ".env.example",
  "middleware.ts",
  "next.config.ts",
  "lib/backend-transport.ts",
  "lib/submissions.ts",
  "app/api/portal/upload/route.ts",
];
const forbiddenSupabaseRuntimePatterns = [
  /supabase-env/,
  /NEXT_PUBLIC_SUPABASE/,
  /WEBFORGE_BACKEND/,
  /supabase\.co/,
  /functions\/v1/,
];
for (const file of noSupabaseRuntimeFiles) {
  const source = await readFile(file, "utf8");
  for (const pattern of forbiddenSupabaseRuntimePatterns) {
    if (pattern.test(source)) throw new Error(`${file}: obsolete Supabase runtime dependency detected (${pattern})`);
  }
}

const adminPages = [
  "app/admin/page.tsx",
  "app/admin/invoices/page.tsx",
  "app/admin/projects/page.tsx",
  "app/admin/portals/page.tsx",
  "app/admin/submissions/page.tsx",
  "app/admin/subscriptions/page.tsx",
];
for (const file of adminPages) {
  const source = await readFile(file, "utf8");
  if (/window\.fetch\s*=/.test(source)) throw new Error(`${file}: must not patch the global fetch`);
  if (/sessionStorage|localStorage/.test(source)) {
    throw new Error(`${file}: must not keep credentials in browser storage`);
  }
}

const adminRoutes = [
  "app/api/admin/leads/route.ts",
  "app/api/admin/leads/status/route.ts",
  "app/api/admin/leads/manage/route.ts",
  "app/api/admin/leads/commercial/route.ts",
  "app/api/admin/offers/route.ts",
  "app/api/admin/projects/route.ts",
  "app/api/admin/projects/portal/route.ts",
  "app/api/admin/invoices/route.ts",
  "app/api/admin/submissions/route.ts",
  "app/api/admin/subscriptions/route.ts",
  "app/api/admin/subscriptions/stripe-checkout/route.ts",
];
for (const file of adminRoutes) {
  const source = await readFile(file, "utf8");
  if (!/await requireAdminSession\(\)/.test(source)) {
    throw new Error(`${file}: must call await requireAdminSession()`);
  }
  if (/\.password\b/.test(source) || /\bpassword\s*:/.test(source)) {
    throw new Error(`${file}: must not read the credential from the request body`);
  }
}

const stripeWebhook = await readFile("app/api/stripe/webhook/route.ts", "utf8");
for (const invariant of ["verifyStripeSignature", "STRIPE_WEBHOOK_SECRET", "stripe_webhook_events"]) {
  if (!stripeWebhook.includes(invariant)) throw new Error(`Stripe webhook missing invariant: ${invariant}`);
}

const sessionRoute = await readFile("app/api/admin/session/route.ts", "utf8");
if (!sessionRoute.includes("revokeAdminSession")) {
  throw new Error("app/api/admin/session: DELETE must revoke the session server side");
}

const [leadRoute, leadsModule] = await Promise.all([
  readFile("app/api/lead/route.ts", "utf8"),
  readFile("lib/leads.ts", "utf8"),
]);
if (!leadsModule.includes("LeadRateLimitError") || !leadsModule.includes("response.status === 429")) {
  throw new Error("lib/leads.ts: backend rate limiting must remain distinguishable");
}
if (!leadRoute.includes("LeadRateLimitError") || !leadRoute.includes("status: 429")) {
  throw new Error("app/api/lead: rate limiting must reach the browser as HTTP 429");
}

const globals = await readFile("app/globals.css", "utf8");
if (!globals.includes(".sr-only")) throw new Error("app/globals.css: .sr-only utility is required for form labels");

for (const file of ["components/demo-handwerk.tsx", "components/demo-gastro.tsx", "components/demo-blumen.tsx"]) {
  const source = await readFile(file, "utf8");
  const controls = (source.match(/<(input|select|textarea)\b/g) || []).filter((tag) => !tag.includes("radio")).length;
  const labels = (source.match(/htmlFor=/g) || []).length;
  if (labels === 0 || labels < controls - 2) {
    throw new Error(`${file}: form controls need labels (${labels} labels for ${controls} controls)`);
  }
}

const sessionModule = await readFile("lib/admin-session.ts", "utf8");
for (const flag of ["httpOnly: true", 'sameSite: "strict"']) {
  if (!sessionModule.includes(flag)) throw new Error(`lib/admin-session.ts: session cookie must set ${flag}`);
}
if (!sessionModule.includes("/^wf[su]_") || !sessionModule.includes("exchangeCredentialsForToken")) {
  throw new Error("lib/admin-session.ts: shared and multi-user session tokens must remain supported");
}

const authBridgeMigration = await readFile("migration/neon/002_multi_user_admin_bridge.sql", "utf8");
for (const invariant of ["private.user_sessions", "admin_gateway_failures", "return null", "('owner', 'admin')"]) {
  if (!authBridgeMigration.includes(invariant)) {
    throw new Error(`Multi-user admin bridge missing invariant: ${invariant}`);
  }
}

const provisionUserScript = await readFile("scripts/provision-neon-user.mjs", "utf8");
for (const invariant of [
  "hiddenQuestion",
  "internal_user_create_session",
  "assert_admin_credential",
  'query("commit")',
]) {
  if (!provisionUserScript.includes(invariant)) {
    throw new Error(`Owner provisioning must self-verify securely: ${invariant}`);
  }
}

const passwordResetRoute = await readFile("app/api/admin/password-reset/route.ts", "utf8");
for (const invariant of ["internal_user_complete_password_reset", "setAdminCookie", '"Cache-Control": "no-store"']) {
  if (!passwordResetRoute.includes(invariant)) {
    throw new Error(`Password reset route missing invariant: ${invariant}`);
  }
}

const stripeModule = await readFile("lib/stripe-signature.ts", "utf8");
if (!stripeModule.includes("timingSafeEqual")) {
  throw new Error("lib/stripe-signature.ts: signature comparison must stay constant time");
}

const companyModule = await readFile("lib/company.ts", "utf8");
if (companyModule.includes("NEXT_PUBLIC_LEGAL_COMPLETE")) {
  throw new Error("lib/company.ts: checkout safety must not be bypassable through the environment");
}

const onboardingModule = await readFile("lib/onboarding.ts", "utf8");
for (const invariant of ["canStartBuild", "canLaunch", "launch-approved", "offer-accepted"]) {
  if (!onboardingModule.includes(invariant)) throw new Error(`Onboarding workflow missing invariant: ${invariant}`);
}

const authorizationModule = await readFile("lib/authorization.ts", "utf8");
for (const role of ["owner", "admin", "staff", "customer"]) {
  if (!authorizationModule.includes(`"${role}"`)) throw new Error(`Authorization role missing: ${role}`);
}

console.log("Source smoke: routes, site engine, onboarding, secrets and auth invariants verified.");

for (const file of [
  "scripts/csp-check.mjs",
  "scripts/a11y-axe.mjs",
  "scripts/a11y-manual.mjs",
  "tests/e2e/admin-flow.mjs",
]) {
  const source = await readFile(file, "utf8");
  if (/\/opt\/pw-browsers/.test(source)) {
    throw new Error(`${file}: must not hardcode a container-specific Chromium path`);
  }
  if (!source.includes("launchChromium")) {
    throw new Error(`${file}: must launch Chromium via scripts/lib/browser.mjs`);
  }
  const relative = source.match(/from "(\.[^"]*browser\.mjs)"/)?.[1];
  if (!relative) throw new Error(`${file}: no import of the browser helper found`);
  const resolved = new URL(relative, new URL(file, `file://${process.cwd()}/`)).pathname;
  await access(resolved);
}
