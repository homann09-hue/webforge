import { access, readFile } from "node:fs/promises";

const required = [
  "app/page.tsx",
  "app/demo/[slug]/page.tsx",
  "components/demo-handwerk.tsx",
  "components/demo-gastro.tsx",
  "components/demo-blumen.tsx",
  "lib/admin-rpc.ts",
  "lib/admin-session.ts",
  "lib/admin-client.ts",
  "lib/company.ts",
  "lib/money.ts",
  "app/admin/layout.tsx",
  "app/api/admin/session/route.ts",
  "next.config.ts",
  "supabase/README.md",
];
for (const file of required) await access(file);

const demoRouter = await readFile("app/demo/[slug]/page.tsx", "utf8");
for (const slug of ["handwerk", "gastro", "blumen"]) {
  // Tolerate any formatting of the object literal.
  if (!new RegExp(`slug\\s*:\\s*["']${slug}["']`).test(demoRouter)) {
    throw new Error(`Missing demo route: ${slug}`);
  }
}

const envExample = await readFile(".env.example", "utf8");
for (const name of ["STRIPE_SECRET_KEY"]) {
  const line = envExample.split(/\r?\n/).find((value) => value.startsWith(`${name}=`));
  if (!line || line !== `${name}=`) throw new Error(`${name} must remain blank in .env.example`);
}

// --- Authentication invariants -------------------------------------------
// These encode decisions that are easy to undo by accident.

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

// Admin route handlers must take the credential from the cookie, never the body.
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
  // Any route that pulls a password out of a request body has regressed.
  if (/\.password\b/.test(source) || /\bpassword\s*:/.test(source)) {
    throw new Error(`${file}: must not read the credential from the request body`);
  }
}

// There must be exactly one Stripe webhook, and it is the Edge Function.
// A second implementation in Next.js would race it non-deterministically.
try {
  await access("app/api/stripe/webhook/route.ts");
  throw new Error("app/api/stripe/webhook: the webhook lives in supabase/functions/stripe-webhook only");
} catch (error) {
  if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
}

// Both copies of the Stripe signature check must stay constant time.
const edgeWebhook = await readFile("supabase/functions/stripe-webhook/index.ts", "utf8");
if (!edgeWebhook.includes("timingSafeEqual")) {
  throw new Error("supabase/functions/stripe-webhook: signature comparison must be constant time");
}

// Logging out must revoke the token server side, not just drop the cookie.
const sessionRoute = await readFile("app/api/admin/session/route.ts", "utf8");
if (!sessionRoute.includes("revokeAdminSession")) {
  throw new Error("app/api/admin/session: DELETE must revoke the session server side");
}

// The session cookie must stay httpOnly.
const sessionModule = await readFile("lib/admin-session.ts", "utf8");
for (const flag of ["httpOnly: true", 'sameSite: "strict"']) {
  if (!sessionModule.includes(flag)) throw new Error(`lib/admin-session.ts: session cookie must set ${flag}`);
}

// The Stripe signature comparison must stay constant time.
const stripeModule = await readFile("lib/stripe-signature.ts", "utf8");
if (!stripeModule.includes("timingSafeEqual")) {
  throw new Error("lib/stripe-signature.ts: signature comparison must be constant time");
}

console.log("Source smoke: routes, secret placeholders and auth invariants verified.");
