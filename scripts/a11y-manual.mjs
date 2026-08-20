/**
 * The checks an automated rule engine cannot make.
 *
 * axe covers roughly a third of WCAG. It does not tell you whether a focus
 * ring is actually visible, whether the layout survives 200% zoom, or whether
 * a tap target is big enough for a thumb. These are scripted here so they are
 * repeatable, not because they replace testing with a real screen reader.
 *
 *   npm run build && (npx next start -p 3100 &) && node scripts/a11y-manual.mjs
 */
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("\n!!! ÜBERSPRUNGEN — NICHT BESTANDEN: playwright fehlt.");
  console.log("  npm i -D playwright && npx playwright install chromium");
  console.log("    npm run test:browser:setup\n");
  process.exit(process.env.CI ? 1 : 0);
}

const BASE = process.env.A11Y_BASE_URL || "http://localhost:3000";
const PAGES = ["/", "/demo/handwerk", "/demo/gastro", "/demo/blumen", "/admin", "/portal/testtoken"];

let failures = 0;
const fail = (msg) => {
  console.log(`  FAIL  ${msg}`);
  failures += 1;
};
const pass = (msg) => console.log(`  ok    ${msg}`);

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium",
});

for (const path of PAGES) {
  console.log(`\n=== ${path} ===`);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });

  // --- 2.4.7 Visible focus indicator -------------------------------------
  // Tab through the first 25 stops and require each to differ visually from
  // its unfocused state (outline, box-shadow, border or background).
  const focusReport = await page.evaluate(() => {
    const interactive = [
      ...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ]
      .filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      })
      .slice(0, 25);

    const snapshot = (el) => {
      const s = getComputedStyle(el);
      return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor].join("|");
    };

    const noIndicator = [];
    for (const el of interactive) {
      const before = snapshot(el);
      el.focus();
      const after = snapshot(el);
      el.blur();
      if (before === after) {
        noIndicator.push(
          el.tagName.toLowerCase() +
            (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : ""),
        );
      }
    }
    return { total: interactive.length, noIndicator };
  });

  if (focusReport.total === 0) {
    pass("keine fokussierbaren Elemente");
  } else if (focusReport.noIndicator.length) {
    fail(
      `2.4.7 Fokusindikator fehlt bei ${focusReport.noIndicator.length}/${focusReport.total}: ${[...new Set(focusReport.noIndicator)].slice(0, 5).join(", ")}`,
    );
  } else {
    pass(`2.4.7 Fokusindikator auf allen ${focusReport.total} geprüften Elementen`);
  }

  // --- 2.5.5 Touch target size -------------------------------------------
  // 44x44 is the AAA figure; AA (2.5.8) asks 24x24. Report against 24 and note
  // anything under it, ignoring inline links inside running text.
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, select, input:not([type=hidden]), a[href]")) {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const inlineLink = el.tagName === "A" && s.display.startsWith("inline") && el.closest("p, li, small");
      if (inlineLink) continue;
      if (r.width < 24 || r.height < 24) {
        out.push(`${el.tagName.toLowerCase()}(${Math.round(r.width)}x${Math.round(r.height)})`);
      }
    }
    return out;
  });
  if (small.length) fail(`2.5.8 Ziel kleiner als 24px: ${[...new Set(small)].slice(0, 6).join(", ")}`);
  else pass("2.5.8 alle Bedienelemente mindestens 24x24");

  // --- 1.4.10 Reflow: 200% zoom must not force horizontal scrolling -------
  await page.setViewportSize({ width: 640, height: 900 }); // ~200% of 1280
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflowing = [...document.querySelectorAll("body *")]
      .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 2)
      .slice(0, 5)
      .map(
        (el) =>
          el.tagName.toLowerCase() +
          (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/)[0] : ""),
      );
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, overflowing };
  });
  if (overflow.scrollW > overflow.clientW + 2) {
    fail(
      `1.4.10 horizontaler Überlauf bei 200% Zoom (${overflow.scrollW}px in ${overflow.clientW}px): ${overflow.overflowing.join(", ")}`,
    );
  } else {
    pass("1.4.10 kein horizontaler Überlauf bei 200% Zoom");
  }

  // --- 1.3.1 / 2.4.1 Landmarks and heading order -------------------------
  const structure = await page.evaluate(() => {
    const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
    const skips = [];
    for (let i = 1; i < levels.length; i += 1)
      if (levels[i] - levels[i - 1] > 1) skips.push(`h${levels[i - 1]}->h${levels[i]}`);
    return {
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main, [role=main]").length,
      lang: document.documentElement.lang,
      skips,
    };
  });
  if (structure.h1 !== 1) fail(`1.3.1 genau eine h1 erwartet, gefunden: ${structure.h1}`);
  else pass("1.3.1 genau eine h1");
  if (structure.main === 0) fail("1.3.1 kein <main>-Landmark");
  else pass("1.3.1 <main>-Landmark vorhanden");
  if (!structure.lang) fail("3.1.1 lang-Attribut fehlt");
  else pass(`3.1.1 lang="${structure.lang}"`);
  if (structure.skips.length) fail(`1.3.1 Überschriftenebene übersprungen: ${structure.skips.join(", ")}`);
  else pass("1.3.1 Überschriftenhierarchie lückenlos");

  await context.close();
}

await browser.close();
console.log(failures === 0 ? "\nAlle manuellen Prüfungen bestanden." : `\n${failures} Befund(e).`);
process.exit(failures === 0 ? 0 : 1);
