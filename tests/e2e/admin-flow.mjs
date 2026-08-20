/**
 * Drives the admin area end to end against a mock of the Supabase Edge
 * Functions.
 *
 * This exists because the cookie rework, adminFetch, the money parsing and the
 * print templates were all rewritten without ever exercising a real login —
 * the live admin password is not available here. The mock closes that gap.
 *
 *   npm run build
 *   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 npx next start -p 3200 &
 *   node tests/e2e/mock-supabase.mjs &
 *   node tests/e2e/admin-flow.mjs
 *
 * Or just: npm run test:e2e
 */
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("playwright nicht installiert — E2E uebersprungen.");
  console.log("  npm i -D playwright && npx playwright install chromium");
  process.exit(0);
}

const BASE = process.env.E2E_BASE_URL || "http://localhost:3200";
const MOCK = process.env.MOCK_BASE_URL || "http://localhost:54321";
const mockState = async () => (await fetch(`${MOCK}/__test__/state`)).json();
const PASSWORD = process.env.MOCK_ADMIN_PASSWORD || "test-password";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
};

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium",
});
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error" && !/favicon|Failed to load resource/i.test(msg.text())) consoleErrors.push(msg.text());
});

// --- 1. The login gate ------------------------------------------------------
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
const passwordField = page.locator('input[type="password"]');
check("Loginformular wird angezeigt", await passwordField.isVisible());

// A wrong password must be rejected and must not let anything through.
await passwordField.fill("wrong-password");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(900);
check("Falsches Passwort wird abgelehnt", await passwordField.isVisible(), "Loginformular noch sichtbar");

// --- 2. Logging in ----------------------------------------------------------
await passwordField.fill(PASSWORD);
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1800);

const loggedIn = !(await passwordField.isVisible().catch(() => false));
check("Login mit korrektem Passwort", loggedIn);

if (!loggedIn) {
  console.log("\nAbbruch: ohne Login sind die weiteren Schritte sinnlos.");
  const body = (await page.textContent("body")) || "";
  console.log("Seiteninhalt:", body.slice(0, 400));
  await browser.close();
  process.exit(1);
}

// --- 3. The credential must live in an httpOnly cookie ----------------------
const cookies = await context.cookies();
const session = cookies.find((c) => c.name === "webforge_admin_session");
check("Session-Cookie gesetzt", Boolean(session));
check("Cookie ist httpOnly", Boolean(session?.httpOnly), `httpOnly=${session?.httpOnly}`);
check("Cookie ist SameSite=Strict", session?.sameSite === "Strict", `sameSite=${session?.sameSite}`);

const readableByJs = await page.evaluate(() => document.cookie.includes("webforge_admin_session"));
check("Cookie fuer JavaScript unsichtbar", readableByJs === false);

const storage = await page.evaluate(() => ({
  session: Object.keys(sessionStorage).length,
  local: Object.keys(localStorage).length,
}));
check(
  "Kein Token in sessionStorage/localStorage",
  storage.session === 0 && storage.local === 0,
  JSON.stringify(storage),
);

// --- 4. Data actually loaded ------------------------------------------------
const bodyText = (await page.textContent("body")) || "";
check("Leads geladen", bodyText.includes("Mustermann GmbH"), "Firmenname im DOM");

// --- 5. A write path --------------------------------------------------------
// Asserting "no error" proves nothing. Ask the backend what it received.
// Selecting by position hit the offer lead picker, so the assertion below
// never saw a status call — and the earlier version of this check, which
// asserted a literal `true`, passed anyway. Find the control in the DOM.
const statusIndex = await page.evaluate(() => {
  const wanted = ["new", "contacted", "qualified", "won", "lost"];
  return [...document.querySelectorAll("select")].findIndex((select) => {
    const values = [...select.options].map((option) => option.value);
    // The list filter offers the same five statuses plus "all". Matching it
    // set the filter to "qualified", which emptied the list — taking the
    // price fields the next step needs with it.
    return wanted.every((value) => values.includes(value)) && !values.includes("all");
  });
});
const statusSelect = statusIndex >= 0 ? page.locator("select").nth(statusIndex) : null;

if (statusSelect) {
  await statusSelect.selectOption("qualified");
  await page.waitForTimeout(900);
  const afterStatus = await mockState();
  const statusCall = afterStatus.calls.find((c) => c.function === "admin_update_lead_status");
  check(
    "Statusaenderung erreicht das Backend",
    statusCall?.args?.p_status === "qualified",
    statusCall ? `p_status=${statusCall.args.p_status}` : "kein admin_update_lead_status-Aufruf",
  );
} else {
  check("Lead-Status-Auswahl gefunden", false, "kein select mit den Status-Optionen");
}

// --- 6. Money parsing, the bug this branch fixed ----------------------------
// "1.249,00" used to become NaN and then be booked as zero. Typing it into a
// field proves nothing on its own — submit, and assert the cents that actually
// reached the backend.
const setupField = page.locator('input[placeholder="Setup \u20ac"]').first();
if (await setupField.count()) {
  await setupField.fill("1.249,00");
  // The button is "Kundenakte speichern". A looser /speichern/ would match
  // "Angebot speichern" higher up the page and silently test nothing.
  await page.getByRole("button", { name: "Kundenakte speichern" }).first().click();
  await page.waitForTimeout(1200);

  const afterMoney = await mockState();
  const commercial = afterMoney.calls.filter((c) => c.function === "admin_update_lead_commercial").pop();
  check(
    "1.249,00 kommt als 124900 Cent an",
    commercial?.args?.p_setup_price_cents === 124900,
    commercial ? `p_setup_price_cents=${commercial.args.p_setup_price_cents}` : "kein Speicheraufruf",
  );
} else {
  check("Setup-Preisfeld gefunden", false, "Selektor passt nicht mehr");
}

// --- 7. No client-side crashes ---------------------------------------------
check("Keine JavaScript-Fehler", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

// --- 8. Logout must revoke, not just forget --------------------------------
const logoutButton = page.getByRole("button", { name: /abmelden|logout/i }).first();
if (await logoutButton.count()) {
  const before = (await context.cookies()).find((c) => c.name === "webforge_admin_session")?.value;
  await logoutButton.click();
  await page.waitForTimeout(900);
  const after = (await context.cookies()).find((c) => c.name === "webforge_admin_session")?.value;
  check(
    "Abmelden loescht das Cookie",
    !after || after !== before,
    `vorher gesetzt=${Boolean(before)}, nachher=${Boolean(after)}`,
  );

  // Asking the app whether it is logged out proves nothing — its cookie is
  // gone either way. Ask the backend whether the token was actually revoked.
  const state = await mockState();
  const revoked = state.sessions.filter((s) => s.revoked).length;
  check("Session serverseitig widerrufen", revoked >= 1, `${revoked} von ${state.sessions.length} widerrufen`);
} else {
  console.log("SKIP  Abmelden — kein Logout-Button auf dieser Seite");
}

// --- 9. The app must never send a raw password to the gateway -------------
// The mock rejects anything that is not a session token, so a regression would
// already have broken the steps above — but assert it explicitly, because that
// is the entire point of the cookie rework.
const finalState = await mockState();
const badCredentials = finalState.calls.filter((c) => !/^wfs_[0-9a-f]{64}$/.test(c.credential || ""));
check(
  "Gateway bekam ausschliesslich Session-Tokens",
  badCredentials.length === 0,
  `${finalState.calls.length} Aufrufe geprueft` +
    (badCredentials.length ? `, davon ${badCredentials.length} mit Passwort` : ""),
);

await browser.close();
console.log(failures === 0 ? "\nAdmin-Flow vollstaendig bestanden." : `\n${failures} Befund(e).`);
process.exit(failures === 0 ? 0 : 1);
