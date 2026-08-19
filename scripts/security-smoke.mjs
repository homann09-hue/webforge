import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set([".git", ".next", "node_modules", "dist", "coverage"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".sql", ".css", ".env", ".example"]);
const RULES = [
  { name: "Stripe live secret", re: /sk_live_[A-Za-z0-9]{16,}/g },
  { name: "Stripe test secret", re: /sk_test_[A-Za-z0-9]{16,}/g },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{16,}/g },
  { name: "Supabase service role assignment", re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!\s*$)(?!your-|changeme|placeholder|<)[^\s#]+/gm },
];

const findings = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!TEXT_EXT.has(extname(entry.name)) && !entry.name.startsWith(".env")) continue;
    const text = await readFile(path, "utf8").catch(() => "");
    for (const rule of RULES) {
      for (const match of text.matchAll(rule.re)) {
        findings.push(`${relative(ROOT, path)}: ${rule.name}`);
      }
    }
  }
}

await walk(ROOT);
if (findings.length) {
  console.error("Secret scan failed:\n" + findings.join("\n"));
  process.exit(1);
}
console.log("Security smoke: no committed secret patterns found.");
