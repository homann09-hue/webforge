import fs from "node:fs";
import path from "node:path";

const input = process.argv[2] || "migration-backup/supabase-schema.sql";
const output = process.argv[3] || "migration-backup/neon-schema.sql";

if (!fs.existsSync(input)) {
  console.error(`Input schema not found: ${input}`);
  process.exit(1);
}

let sql = fs.readFileSync(input, "utf8");

// Neon uses pgcrypto in a normal schema; Supabase installs it under `extensions`.
sql = sql.replaceAll("extensions.crypt", "crypt");
sql = sql.replaceAll("extensions.gen_salt", "gen_salt");
sql = sql.replaceAll("extensions.digest", "digest");

// Remove the Supabase-only `extensions` schema from function search paths.
sql = sql.replaceAll("'public', 'extensions', 'pg_temp'", "'public', 'pg_temp'");
sql = sql.replaceAll("'public', 'private', 'extensions', 'pg_temp'", "'public', 'private', 'pg_temp'");
sql = sql.replaceAll("'public', 'extensions'", "'public'");

// Supabase Vault is not part of Neon. pg_dump emits the CREATE FUNCTION inside
// a named section and may quote identifiers. Remove that complete section by
// locating the function name rather than depending on its exact SQL layout.
const vaultName = "internal_get_stripe_webhook_secret";
const vaultNameIndex = sql.indexOf(vaultName);
if (vaultNameIndex !== -1) {
  const createStart = sql.lastIndexOf("CREATE OR REPLACE FUNCTION", vaultNameIndex);
  if (createStart === -1) {
    console.error("Found Vault function name but could not locate its CREATE FUNCTION statement");
    process.exit(2);
  }

  const nextSection = sql.indexOf("\n--\n-- Name:", vaultNameIndex + vaultName.length);
  if (nextSection !== -1) {
    sql = sql.slice(0, createStart) + sql.slice(nextSection);
  } else {
    // Fallback: stop at the next CREATE FUNCTION if section markers are absent.
    const nextFunction = sql.indexOf("CREATE OR REPLACE FUNCTION", vaultNameIndex + vaultName.length);
    sql = sql.slice(0, createStart) + (nextFunction === -1 ? "" : sql.slice(nextFunction));
  }
}

// pg_dump ACL/owner sections can appear much later than the CREATE FUNCTION
// section. Remove every remaining line that references the removed function,
// plus the immediately preceding pg_dump comment block when present.
const lines = sql.split("\n");
const filtered = [];
for (let i = 0; i < lines.length; i += 1) {
  if (!lines[i].includes(vaultName)) {
    filtered.push(lines[i]);
    continue;
  }

  // Remove the standard three-line pg_dump section header already copied to
  // the output: "--", "-- Name: ...", "--".
  while (filtered.length && filtered.at(-1) === "") filtered.pop();
  if (filtered.at(-1) === "--") filtered.pop();
  if (filtered.at(-1)?.startsWith("-- Name:")) filtered.pop();
  if (filtered.at(-1) === "--") filtered.pop();
}
sql = filtered.join("\n");

// The live database still carries the legacy SHA-256-only length constraint,
// while the current password code supports bcrypt (60 chars) and legacy
// SHA-256 (64 chars). Make the portable Neon schema accept both formats.
sql = sql.replace(
  /CHECK \(char_length\(password_hash\) = 64\)/g,
  "CHECK (char_length(password_hash) IN (60, 64))",
);

// Ensure pgcrypto is available before any functions using digest/crypt/gen_salt.
const prelude = [
  "-- Generated from the WebForge Supabase production schema.",
  "-- Neon compatibility adjustments are applied by scripts/prepare-neon-schema.mjs.",
  "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
  "",
].join("\n");

sql = prelude + sql;

const forbidden = [
  "vault.",
  "extensions.crypt",
  "extensions.gen_salt",
  "extensions.digest",
  vaultName,
];
const leftovers = forbidden.filter((needle) => sql.includes(needle));
if (leftovers.length) {
  console.error(`Neon schema still contains Supabase-only references: ${leftovers.join(", ")}`);
  process.exit(2);
}

const functionCount = (sql.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
if (functionCount !== 46) {
  console.error(`Unexpected Neon function count: ${functionCount} (expected 46)`);
  process.exit(3);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, sql);

console.log(`Wrote ${output}`);
console.log(`Functions retained: ${functionCount}`);
console.log("Supabase Vault function removed: yes");
