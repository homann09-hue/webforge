/**
 * Orchestrates the admin end-to-end run: isolated backend mock, production
 * build, server, browser test, cleanup.
 *
 *   npm run test:e2e
 *
 * The application now talks directly to Neon in production. During E2E we
 * enable WEBFORGE_E2E_MODE and route the provider-neutral backend transport to
 * a localhost-only mock. No production database or credentials are touched.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { rm } from "node:fs/promises";

const MOCK_PORT = 54321;
const APP_PORT = 3200;
const MOCK_URL = `http://localhost:${MOCK_PORT}`;
const APP_URL = `http://localhost:${APP_PORT}`;

const children = [];

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, { stdio: "pipe", detached: true, ...options });
  children.push(child);
  return child;
}

async function shutdown() {
  for (const child of children) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already gone */
      }
    }
  }
}
process.on("exit", shutdown);
process.on("SIGINT", () => {
  void shutdown();
  process.exit(130);
});

async function waitFor(url, label, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.status > 0) return true;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error(`${label} kam unter ${url} nicht hoch`);
}

async function assertPortFree(url, label) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1500) });
  } catch {
    return;
  }
  throw new Error(`Port fuer ${label} (${url}) ist belegt. Bitte den alten Prozess beenden.`);
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} endete mit Code ${code}`))));
  });
}

const e2eEnv = {
  ...process.env,
  WEBFORGE_E2E_MODE: "1",
  WEBFORGE_E2E_BACKEND_URL: MOCK_URL,
};

try {
  await assertPortFree(MOCK_URL, "Mock-Backend");
  await assertPortFree(APP_URL, "App");

  console.log("1/4  Mock-Backend starten");
  const mock = spawnChild(process.execPath, ["tests/e2e/mock-supabase.mjs"], {
    env: { ...process.env, MOCK_PORT: String(MOCK_PORT) },
  });
  mock.stderr.on("data", (d) => process.stderr.write(`[mock] ${d}`));
  await waitFor(`${MOCK_URL}/__test__/state`, "Mock-Backend");

  console.log("2/4  App im isolierten Backend-Testmodus bauen");
  await rm(".next", { recursive: true, force: true });
  await run("npx", ["next", "build"], { env: e2eEnv, stdio: "ignore" });

  console.log("3/4  App starten");
  const app = spawnChild("npx", ["next", "start", "-p", String(APP_PORT)], { env: e2eEnv });
  let appLog = "";
  app.stdout.on("data", (d) => (appLog += d));
  app.stderr.on("data", (d) => (appLog += d));
  await waitFor(`${APP_URL}/admin`, "App").catch((error) => {
    console.error(appLog.slice(-1200));
    throw error;
  });
  if (appLog.includes("EADDRINUSE")) throw new Error("next start konnte den Port nicht belegen");

  console.log("4/4  Admin-Flow ausfuehren\n");
  await run(process.execPath, ["tests/e2e/admin-flow.mjs"], {
    env: { ...e2eEnv, E2E_BASE_URL: APP_URL, MOCK_BASE_URL: MOCK_URL },
  });

  await shutdown();
  process.exit(0);
} catch (error) {
  console.error(`\n${error.message}`);
  await shutdown();
  process.exit(1);
}
