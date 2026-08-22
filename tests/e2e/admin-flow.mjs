import { bailWithoutPlaywright, launchChromium, loadPlaywright } from "../../scripts/lib/browser.mjs";

const playwright = await loadPlaywright();
if (!playwright) bailWithoutPlaywright("Admin-Flow");
const { chromium } = playwright;

const BASE = process.env.E2E_BASE_URL || "http://localhost:3200";
const MOCK = process.env.MOCK_BASE_URL || "http://localhost:54321";
const mockState = async () => (await fetch(`${MOCK}/__test__/state`)).json();
const PASSWORD = process.env.MOCK_ADMIN_PASSWORD || "test-password";
const EMAIL = process.env.MOCK_ADMIN_EMAIL || "admin@example.test";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
};

const browser = await launchChromium(chromium);
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error" && !/favicon|Failed to load resource/i.test(msg.text())) consoleErrors.push(msg.text());
});

async function appPost(path, payload) {
  return page.evaluate(
    async ({ path, payload }) => {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { status: response.status, body: await response.json().catch(() => ({})) };
    },
    { path, payload },
  );
}

async function appGet(path) {
  return page.evaluate(async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }, path);
}

// 1. Login gate
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
const passwordField = page.locator('input[type="password"]');
const emailField = page.locator('input[type="email"]');
check("Loginformular wird angezeigt", await passwordField.isVisible());

await emailField.fill(EMAIL);
await passwordField.fill("wrong-password");
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(900);
check("Falsches Passwort wird abgelehnt", await passwordField.isVisible(), "Loginformular noch sichtbar");

await emailField.fill(EMAIL);
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

// 2. Session security
const cookies = await context.cookies();
const session = cookies.find((cookie) => cookie.name === "webforge_admin_session");
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

// 3. Lead data and write path
const bodyText = (await page.textContent("body")) || "";
check("Leads geladen", bodyText.includes("Mustermann GmbH"), "Firmenname im DOM");

const statusIndex = await page.evaluate(() => {
  const wanted = ["new", "contacted", "qualified", "won", "lost"];
  return [...document.querySelectorAll("select")].findIndex((select) => {
    const values = [...select.options].map((option) => option.value);
    return wanted.every((value) => values.includes(value)) && !values.includes("all");
  });
});
const statusSelect = statusIndex >= 0 ? page.locator("select").nth(statusIndex) : null;
if (statusSelect) {
  await statusSelect.selectOption("qualified");
  await page.waitForTimeout(900);
  const afterStatus = await mockState();
  const statusCall = afterStatus.calls.find((call) => call.function === "admin_update_lead_status");
  check(
    "Statusaenderung erreicht das Backend",
    statusCall?.args?.p_status === "qualified",
    statusCall ? `p_status=${statusCall.args.p_status}` : "kein admin_update_lead_status-Aufruf",
  );
} else {
  check("Lead-Status-Auswahl gefunden", false, "kein passendes Status-Select");
}

const setupField = page.locator('input[placeholder="Setup \u20ac"]').first();
if (await setupField.count()) {
  await setupField.fill("1.249,00");
  await page.getByRole("button", { name: "Kundenakte speichern" }).first().click();
  await page.waitForTimeout(1200);
  const afterMoney = await mockState();
  const commercial = afterMoney.calls.filter((call) => call.function === "admin_update_lead_commercial").pop();
  check(
    "1.249,00 kommt als 124900 Cent an",
    commercial?.args?.p_setup_price_cents === 124900,
    commercial ? `p_setup_price_cents=${commercial.args.p_setup_price_cents}` : "kein Speicheraufruf",
  );
} else {
  check("Setup-Preisfeld gefunden", false, "Selektor passt nicht mehr");
}

// 4. Commercial flow: offer -> accepted project
const createOffer = await appPost("/api/admin/offers", {
  action: "create",
  leadId: 1,
  title: "Business Website Mustermann",
  discountPercent: 0,
  taxPercent: 19,
  validUntil: "2026-09-15",
  notes: "E2E Testangebot",
  items: [{ description: "Business Website", quantity: 1, unit: "Pauschal", unitPriceCents: 124900 }],
});
check("Angebot wird erstellt", createOffer.status === 201 && Number.isInteger(createOffer.body.offerId));
const offerId = Number(createOffer.body.offerId);

const acceptOffer = await appPost("/api/admin/offers", { action: "status", offerId, status: "accepted" });
check("Angebot wird angenommen", acceptOffer.status === 200 && acceptOffer.body.ok === true);

const projectList = await appPost("/api/admin/projects", { action: "list" });
const project = projectList.body.projects?.find((item) => item.offer_id === offerId);
check(
  "Angenommenes Angebot erzeugt Projekt",
  projectList.status === 200 && Boolean(project),
  project?.project_number || "kein Projekt",
);
const projectId = Number(project?.id);

// 5. Onboarding and task gate
if (projectId > 0) {
  const onboarding = await appPost("/api/admin/projects", {
    action: "onboarding",
    projectId,
    onboardingStatus: "ready",
    contentDeadline: "2026-09-01",
    logoReceived: true,
    imagesReceived: true,
    textsReceived: true,
    domainAccessReceived: true,
    legalDataReceived: true,
  });
  check("Projekt-Onboarding wird gespeichert", onboarding.status === 200 && onboarding.body.ok === true);

  const taskSave = await appPost("/api/admin/projects", {
    action: "task-save",
    projectId,
    title: "Finale Inhalte prüfen",
    category: "content",
    required: true,
    completed: true,
    sortOrder: 1,
    notes: "E2E",
  });
  check("Projekt-Checklistenpunkt wird gespeichert", taskSave.status === 200 && Number.isInteger(taskSave.body.id));

  const tasks = await appPost("/api/admin/projects", { action: "tasks", projectId });
  check(
    "Projekt-Checkliste ist lesbar",
    tasks.status === 200 && tasks.body.tasks?.some((task) => task.title === "Finale Inhalte prüfen"),
  );
}

// 6. Customer portal
const rotatePortal = await appPost("/api/admin/projects/portal", { action: "rotate", projectId });
const portalToken = String(rotatePortal.body.token || "");
check("Portal-Link wird erzeugt", rotatePortal.status === 200 && portalToken.startsWith("wfp_"));

if (portalToken) {
  const portal = await appGet(`/api/portal/${portalToken}`);
  check(
    "Kundenportal ist mit Token erreichbar",
    portal.status === 200 && portal.body.project?.project_id === projectId,
  );

  const submission = await appPost(`/api/portal/${portalToken}`, {
    kind: "text",
    label: "Freigabe",
    content: "Inhalte sind freigegeben.",
  });
  check("Kunde kann Portal-Abgabe senden", submission.status === 201 && submission.body.ok === true);
}

// 7. Invoice and payment
const createInvoice = await appPost("/api/admin/invoices", {
  action: "create",
  leadId: 1,
  projectId,
  invoiceType: "setup",
  title: "Einrichtung WebForge Business",
  issueDate: "2026-08-22",
  dueDate: "2026-09-05",
  taxPercent: 19,
  notes: "E2E Rechnung",
  items: [{ description: "Business Website", quantity: 1, unit: "Pauschal", unitPriceCents: 124900 }],
});
check("Rechnung wird erstellt", createInvoice.status === 201 && Number.isInteger(createInvoice.body.invoiceId));
const invoiceId = Number(createInvoice.body.invoiceId);

const openInvoice = await appPost("/api/admin/invoices", { action: "status", invoiceId, status: "open" });
check("Rechnung wird offen gestellt", openInvoice.status === 200 && openInvoice.body.ok === true);

const invoiceListBeforePayment = await appPost("/api/admin/invoices", { action: "list" });
const invoiceBeforePayment = invoiceListBeforePayment.body.invoices?.find((item) => item.id === invoiceId);
const grossCents = Number(invoiceBeforePayment?.gross_cents);
check(
  "Kleinunternehmer-Regel erzwingt 0 Prozent Umsatzsteuer",
  grossCents === 124900 && Number(invoiceBeforePayment?.tax_percent) === 0,
  `gross=${grossCents}, tax=${invoiceBeforePayment?.tax_percent}`,
);

const payment = await appPost("/api/admin/invoices", {
  action: "payment",
  invoiceId,
  amountCents: grossCents,
  method: "bank_transfer",
  reference: "E2E-PAID",
  paidAt: "2026-08-22T12:00:00Z",
});
check("Zahlung wird verbucht", payment.status === 200 && payment.body.ok === true);

const invoiceListAfterPayment = await appPost("/api/admin/invoices", { action: "list" });
const paidInvoice = invoiceListAfterPayment.body.invoices?.find((item) => item.id === invoiceId);
check(
  "Vollzahlung setzt Rechnung auf bezahlt",
  paidInvoice?.status === "paid" && paidInvoice?.balance_cents === 0 && paidInvoice?.paid_cents === grossCents,
  paidInvoice ? `status=${paidInvoice.status}, balance=${paidInvoice.balance_cents}` : "Rechnung fehlt",
);

// 8. Browser stability
check("Keine JavaScript-Fehler", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

// 9. Logout must revoke, not just forget
const logoutButton = page.getByRole("button", { name: /abmelden|logout/i }).first();
if (await logoutButton.count()) {
  const before = (await context.cookies()).find((cookie) => cookie.name === "webforge_admin_session")?.value;
  await logoutButton.click();
  await page.waitForTimeout(900);
  const after = (await context.cookies()).find((cookie) => cookie.name === "webforge_admin_session")?.value;
  check(
    "Abmelden loescht das Cookie",
    !after || after !== before,
    `vorher=${Boolean(before)}, nachher=${Boolean(after)}`,
  );

  const state = await mockState();
  const revoked = state.sessions.filter((item) => item.revoked).length;
  check("Session serverseitig widerrufen", revoked >= 1, `${revoked} von ${state.sessions.length} widerrufen`);
} else {
  check("Logout-Button gefunden", false);
}

// 10. Temporary shared-login fallback remains usable during the account rollout
await emailField.fill("");
await passwordField.fill(PASSWORD);
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1200);
check("Shared-Login bleibt als Übergangszugang nutzbar", !(await passwordField.isVisible().catch(() => false)));

// 11. Raw passwords must never reach the admin gateway
const finalState = await mockState();
const badCredentials = finalState.calls.filter((call) => !/^wf[su]_[0-9a-f]{64}$/.test(call.credential || ""));
check(
  "Gateway bekam ausschliesslich Session-Tokens",
  badCredentials.length === 0,
  `${finalState.calls.length} Aufrufe geprueft${badCredentials.length ? `, ${badCredentials.length} falsch` : ""}`,
);

check(
  "Geschaeftsflow hat Angebot",
  finalState.offers.some((offer) => offer.id === offerId && offer.status === "accepted"),
);
check(
  "Geschaeftsflow hat Projekt",
  finalState.projects.some((item) => item.id === projectId),
);
check(
  "Geschaeftsflow hat bezahlte Rechnung",
  finalState.invoices.some((item) => item.id === invoiceId && item.status === "paid"),
);

await browser.close();
console.log(failures === 0 ? "\nAdmin- und Auftragsflow vollstaendig bestanden." : `\n${failures} Befund(e).`);
process.exit(failures === 0 ? 0 : 1);
