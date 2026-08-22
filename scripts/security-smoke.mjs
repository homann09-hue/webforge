import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".sql",
  ".css",
  ".env",
  ".example",
]);
const RULES = [
  { name: "Stripe live secret", re: /sk_live_[A-Za-z0-9]{16,}/g },
  { name: "Stripe test secret", re: /sk_test_[A-Za-z0-9]{16,}/g },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{16,}/g },
  { name: "Supabase service role assignment", re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]+/g },
];

// This guard is for committed source, not developer-local environment files.
// Restrict the scan to Git-tracked paths so untracked .env.local/.env.preview
// files can contain the secrets required for local verification without causing
// false positives.
const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});

const trackedFiles = stdout.split("\0").filter(Boolean);
const findings = [];

for (const file of trackedFiles) {
  const name = file.split("/").pop() || file;
  if (!TEXT_EXT.has(extname(name)) && !name.startsWith(".env")) continue;

  const text = await readFile(file, "utf8").catch(() => "");
  for (const rule of RULES) {
    if (![...text.matchAll(rule.re)].length) continue;
    if (name === ".env.example" && rule.name === "Supabase service role assignment") continue;
    findings.push(`${file}: ${rule.name}`);
  }
}

if (findings.length) {
  console.error("Secret scan failed:\n" + findings.join("\n"));
  process.exit(1);
}
console.log("Security smoke: no committed secret patterns found.");
