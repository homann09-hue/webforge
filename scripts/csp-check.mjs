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
import { get as httpsGet } from "node:https";

const BASE = process.env.CSP_BASE_URL || "http://localhost:3000";

/**
 * Playwright is intentionally not a dependency of this project — installing it
 * pulls a browser download into every `npm install` for the sake of one script
 * that is not part of `npm run verify`. The header checks below run without it;
 * the rendering checks are skipped with a note if it is absent.
 *
 *   npm i -D playwright && npx playwright install chromium
 */
import { bailWithoutPlaywright, launchChromium, loadPlaywright } from "./lib/browser.mjs";

const playwright = await loadPlaywright();
if (!playwright) bailWithoutPlaywright("CSP-Pruefung");
const { chromium } = playwright;

const browser = await launchChromium(chromium);

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
  // Resolves rather than rejects. A bare top-level `await` on a rejecting
  // promise kills the script before a single result prints and leaks the
  // Chromium already launched above — the opposite of reporting a failure.
  return new Promise((resolve) => {
    // node:http cannot speak https, and the rest of this script uses fetch(),
    // which can — so a CSP_BASE_URL pointing at the deployed site used to abort
    // the whole run with ERR_INVALID_PROTOCOL instead of reporting a failure.
    const get = url.startsWith("https:") ? httpsGet : httpGet;
    const request = get(url, (response) => {
      const names = [];
      for (let i = 0; i < response.rawHeaders.length; i += 2) names.push(response.rawHeaders[i].toLowerCase());
      response.resume();
      resolve(names.filter((name) => name === header).length);
    });
    request.on("error", (error) => resolve(`Fehler: ${error.code || error.message}`));
    // http.get has no default timeout; a server that accepts the socket and
    // never answers would hang the check indefinitely.
    request.setTimeout(10_000, () => {
      request.destroy(new Error(`Zeitüberschreitung beim Lesen der Header von ${url}`));
    });
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
  // Only the absence of CSP violations is asserted here. Tying this to a
  // minimum text length made it depend on a reachable Supabase: in CI the
  // backend is deliberately absent, so /portal/testtoken renders its short
  // "Portal nicht verfügbar" state and the check failed for the wrong reason.
  // Hydration is proven separately below.
  const hydrated = await page.evaluate(() => document.body.children.length > 0);

  // A server left running from an earlier build serves chunk URLs that no
  // longer exist; the 404 comes back as HTML and the browser reports it as a
  // MIME/blocked-script error that reads exactly like a CSP violation. Name it,
  // because chasing it as a policy problem costs an hour.
  const staleServer = violations.some((v) => /MIME type \('text\/html'\)/.test(v));
  check(
    `${path}: rendert ohne CSP-Verstoß`,
    violations.length === 0 && hydrated,
    staleServer
      ? "Server liefert Chunks eines anderen Builds aus — alten Prozess beenden und neu starten"
      : violations[0] || "",
  );
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

check("Inline-Handler auf /admin blockiert", (await inlineHandlerRuns("/admin")) === false);
// Documents the deliberate difference: static pages keep 'unsafe-inline'
// because a nonce cannot be baked into a prerendered page.
check("Inline-Handler auf / erlaubt (bewusst, statische Seite)", (await inlineHandlerRuns("/")) === true);
await browser.close();
console.log(failures === 0 ? "\nCSP-Prüfung bestanden." : `\n${failures} Prüfung(en) fehlgeschlagen.`);
process.exit(failures === 0 ? 0 : 1);
