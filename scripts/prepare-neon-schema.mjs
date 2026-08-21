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

// Supabase Vault is not part of Neon. Remove the entire pg_dump function block,
// including any following ALTER FUNCTION owner statement. We intentionally use
// the next pg_dump section marker as the boundary instead of relying on the
// function dollar-quote tag/semicolon layout, which varies by pg_dump version.
const vaultStart = sql.indexOf("CREATE OR REPLACE FUNCTION public.internal_get_stripe_webhook_secret()");
if (vaultStart !== -1) {
  const nextSection = sql.indexOf("\n--\n-- Name:", vaultStart + 1);
  if (nextSection !== -1) {
    sql = sql.slice(0, vaultStart) + sql.slice(nextSection);
  } else {
    // Fallback for dumps without pg_dump section comments.
    sql = sql.replace(
      /CREATE OR REPLACE FUNCTION public\.internal_get_stripe_webhook_secret\(\)[\s\S]*?(?=CREATE OR REPLACE FUNCTION|$)/,
      "",
    );
  }
}

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

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, sql);

const forbidden = [
  "vault.",
  "extensions.crypt",
  "extensions.gen_salt",
  "extensions.digest",
  "internal_get_stripe_webhook_secret",
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

console.log(`Wrote ${output}`);
console.log(`Functions retained: ${functionCount}`);
console.log("Supabase Vault function removed: yes");
