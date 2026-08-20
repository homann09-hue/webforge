/**
 * WCAG 2.1 AA scan with axe-core against a running production build.
 *
 * Not part of `npm run verify`: it needs a server and a browser.
 *
 *   npm run build && (npx next start -p 3100 &) && npm run test:a11y
 *
 * axe covers roughly a third of WCAG. scripts/a11y-manual.mjs adds the checks
 * a rule engine cannot make (focus visibility, reflow at 200%, target size),
 * and neither replaces testing with a real screen reader.
 *
 * Requires: npm i -D playwright @axe-core/playwright && npx playwright install chromium
 */
import { bailWithoutPlaywright, launchChromium, loadPlaywright } from "./lib/browser.mjs";

const playwright = await loadPlaywright();
let AxeBuilder;
try {
  ({ AxeBuilder } = await import("@axe-core/playwright"));
} catch {
  AxeBuilder = null;
}
if (!playwright || !AxeBuilder) bailWithoutPlaywright("Barrierefreiheit (axe)");
const { chromium } = playwright;

const BASE = process.env.A11Y_BASE_URL || "http://localhost:3000";
const PAGES = [
  "/",
  "/demo/handwerk",
  "/demo/gastro",
  "/demo/blumen",
  "/impressum",
  "/datenschutz",
  "/admin",
  "/portal/testtoken",
];
const browser = await launchChromium(chromium);
const all = {};

for (const path of PAGES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  all[path] = results.violations;
  const counts = results.violations.reduce((m, v) => ((m[v.impact] = (m[v.impact] || 0) + v.nodes.length), m), {});
  console.log(`\n=== ${path} — ${results.violations.length} Regel(n) verletzt ===`, JSON.stringify(counts));
  for (const v of results.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    console.log(`     WCAG: ${v.tags.filter((t) => t.startsWith("wcag")).join(", ")} | betroffen: ${v.nodes.length}`);
    console.log(
      `     z.B.: ${v.nodes[0].target.join(" ")} -> ${(v.nodes[0].failureSummary || "").split("\n").filter(Boolean)[1]?.trim().slice(0, 120) || ""}`,
    );
  }
  await context.close();
}
await browser.close();

const total = Object.values(all)
  .flat()
  .reduce((n, v) => n + v.nodes.length, 0);
const rules = new Set(
  Object.values(all)
    .flat()
    .map((v) => v.id),
);
console.log(`\n########## GESAMT: ${total} Verstöße, ${rules.size} verschiedene Regeln ##########`);
console.log([...rules].join(", "));

process.exit(total === 0 ? 0 : 1);
