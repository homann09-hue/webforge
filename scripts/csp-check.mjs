/**
 * Verifies the Content-Security-Policy against a running production build.
 *
 * Not part of `npm run verify`: it needs `npm run build && npm start` first.
 * Run it after touching middleware.ts or the headers in next.config.ts.
 *
 *   npm run build && (npm start &) && sleep 5 && npm run test:csp
 *
 * A note on what can and cannot be tested here. Playwright's page.evaluate()
 * runs through the DevTools protocol, which bypasses CSP — so injecting a
 * <script> element or calling eval() from it proves nothing about the page's
 * policy. Inline event handler attributes are different: they are evaluated by
 * the page's own event system and are subject to its CSP, which makes them the
 * one honest probe available from here. They are also a realistic XSS vector.
 */
import { get as httpGet } from "node:http";

const BASE = process.env.CSP_BASE_URL || "http://localhost:3000";

/**
 * Playwright is intentionally not a dependency of this project — installing it
 * pulls a browser download into every `npm install` for the sake of one script
 * that is not part of `npm run verify`. The header checks below run without it;
 * the rendering checks are skipped with a note if it is absent.
 *
 *   npm i -D playwright && npx playwright install chromium
 */
let chromium = null;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("Hinweis: playwright nicht installiert — Browser-Prüfungen werden übersprungen.");
  console.log("         npm i -D playwright && npx playwright install chromium\n");
}

const browser = chromium
  ? await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined })
  : null;

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

/**
 * Exactly one CSP header per response. Two would be enforced as an
 * intersection and would block the nonced scripts.
 *
 * fetch() cannot see this: Headers.get() joins duplicate values with ", ", so
 * two policies look like one long string and the check passes. node:http keeps
 * them separate in rawHeaders, which is the only way to actually count them.
 */
function rawHeaderCount(url, header) {
  return new Promise((resolve, reject) => {
    const request = httpGet(url, (response) => {
      const names = [];
      for (let i = 0; i < response.rawHeaders.length; i += 2) names.push(response.rawHeaders[i].toLowerCase());
      response.resume();
      resolve(names.filter((name) => name === header).length);
    });
    request.on("error", reject);
  });
}

for (const path of ["/", "/impressum", "/admin", "/portal/x"]) {
  const count = await rawHeaderCount(`${BASE}${path}`, "content-security-policy");
  check(`${path}: genau ein CSP-Header`, count === 1, `${count} gefunden`);
}

// Next.js must stamp its nonce onto every script it emits on the guarded
// routes, or the page simply will not run.
const html = await (await fetch(`${BASE}/admin`)).text();
const nonced = [...html.matchAll(/<script[^>]*\snonce="([^"]+)"/g)].length;
const total = [...html.matchAll(/<script[\s>]/g)].length;
check("Next.js setzt Nonces auf /admin", nonced === total && total > 0, `${nonced}/${total} script-Tags`);

const second = await (await fetch(`${BASE}/admin`)).text();
const first = html.match(/nonce="([^"]+)"/)?.[1];
const again = second.match(/nonce="([^"]+)"/)?.[1];
check("Nonce ist pro Response neu", Boolean(first && again && first !== again));

// Every page must still render and hydrate under its policy.
for (const path of browser
  ? ["/", "/impressum", "/demo/gastro", "/admin", "/admin/invoices", "/portal/testtoken"]
  : []) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const violations = [];
  page.on("console", (msg) => {
    if (/Content Security Policy|Refused to (execute|load|apply)/i.test(msg.text())) violations.push(msg.text());
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });
  const text = ((await page.textContent("body")) || "").trim();
  check(`${path}: rendert ohne CSP-Verstoß`, violations.length === 0 && text.length > 100, violations[0] || "");
  await context.close();
}

// The policy must actually block something, or it is decoration.
async function inlineHandlerRuns(path) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const ran = await page.evaluate(() => {
    const button = document.createElement("button");
    button.setAttribute("onclick", "window.__cspProbe = true");
    document.body.appendChild(button);
    button.click();
    return window.__cspProbe === true;
  });
  await context.close();
  return ran;
}

if (browser) {
  check("Inline-Handler auf /admin blockiert", (await inlineHandlerRuns("/admin")) === false);
  // Documents the deliberate difference: static pages keep 'unsafe-inline'
  // because a nonce cannot be baked into a prerendered page.
  check("Inline-Handler auf / erlaubt (bewusst, statische Seite)", (await inlineHandlerRuns("/")) === true);
  await browser.close();
}
console.log(failures === 0 ? "\nCSP-Prüfung bestanden." : `\n${failures} Prüfung(en) fehlgeschlagen.`);
process.exit(failures === 0 ? 0 : 1);
