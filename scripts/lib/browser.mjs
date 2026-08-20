/**
 * Resolves a Chromium for the browser-driven checks.
 *
 * There were four scripts and three different answers to this question, which
 * is how the CI job shipped in a state where it could never pass: three of them
 * hardcoded `/opt/pw-browsers/chromium`, a path that exists only in this
 * development container, while `npx playwright install` in CI puts Chromium in
 * ~/.cache/ms-playwright. The fourth passed `undefined`, so it worked in CI and
 * failed here. Every script now shares this resolver.
 *
 * Order:
 *   1. PLAYWRIGHT_CHROMIUM, if set — explicit wins.
 *   2. Playwright's own managed browser (executablePath undefined).
 *   3. The dev container's path, if it happens to exist.
 */
import { existsSync } from "node:fs";

const CONTAINER_CHROMIUM = "/opt/pw-browsers/chromium";

/** Loads playwright, or returns null with an explanation printed. */
export async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return null;
  }
}

/**
 * Whether a missing browser toolchain should fail the run.
 *
 * `process.env.CI ? 1 : 0` was wrong: CI="false" and CI="0" are both truthy
 * strings, so the check hard-failed for exactly the people who had asked it
 * not to.
 */
export function isCi() {
  return /^(1|true|yes)$/i.test(process.env.CI ?? "");
}

/**
 * Launches Chromium, trying each candidate in turn.
 * Throws only if every candidate fails, with all the errors attached.
 */
export async function launchChromium(chromium, options = {}) {
  const candidates = [];
  if (process.env.PLAYWRIGHT_CHROMIUM) candidates.push(process.env.PLAYWRIGHT_CHROMIUM);
  candidates.push(undefined); // playwright-managed install
  if (existsSync(CONTAINER_CHROMIUM)) candidates.push(CONTAINER_CHROMIUM);

  const errors = [];
  for (const executablePath of candidates) {
    try {
      return await chromium.launch({ ...options, executablePath });
    } catch (error) {
      errors.push(`${executablePath ?? "(playwright-managed)"}: ${error.message.split("\n")[0]}`);
    }
  }
  throw new Error(`Kein startbares Chromium gefunden:\n  ${errors.join("\n  ")}`);
}

/** Uniform "playwright is missing" handling for all four scripts. */
export function bailWithoutPlaywright(scriptName) {
  const ci = isCi();
  console.log(`\n!!! ${scriptName}: playwright fehlt — ${ci ? "FEHLSCHLAG (CI)" : "übersprungen"}.`);
  console.log("  npm run test:browser:setup\n");
  process.exit(ci ? 1 : 0);
}
