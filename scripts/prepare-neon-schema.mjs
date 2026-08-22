import fs from "node:fs";
import path from "node:path";

const input = process.argv[2] || "migration-backup/supabase-schema.sql";
const output = process.argv[3] || "migration-backup/neon-schema.sql";

if (!fs.existsSync(input)) {
  console.error(`Input schema not found: ${input}`);
  process.exit(1);
}

let sql = fs.readFileSync(input, "utf8");

sql = sql.replaceAll("extensions.crypt", "crypt");
sql = sql.replaceAll("extensions.gen_salt", "gen_salt");
sql = sql.replaceAll("extensions.digest", "digest");
sql = sql.replaceAll("'public', 'extensions', 'pg_temp'", "'public', 'pg_temp'");
sql = sql.replaceAll("'public', 'private', 'extensions', 'pg_temp'", "'public', 'private', 'pg_temp'");
sql = sql.replaceAll("'public', 'extensions'", "'public'");

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
    const nextFunction = sql.indexOf("CREATE OR REPLACE FUNCTION", vaultNameIndex + vaultName.length);
    sql = sql.slice(0, createStart) + (nextFunction === -1 ? "" : sql.slice(nextFunction));
  }
}

const lines = sql.split("\n");
const filtered = [];
for (let i = 0; i < lines.length; i += 1) {
  if (!lines[i].includes(vaultName)) {
    filtered.push(lines[i]);
    continue;
  }
  while (filtered.length && filtered.at(-1) === "") filtered.pop();
  if (filtered.at(-1) === "--") filtered.pop();
  if (filtered.at(-1)?.startsWith("-- Name:")) filtered.pop();
  if (filtered.at(-1) === "--") filtered.pop();
}
sql = filtered.join("\n");

// Supabase ownership and ACL statements reference roles that do not exist in Neon.
// The connected Neon role should own imported objects, and WebForge will access
// the database server-side via DATABASE_URL rather than Supabase Data API roles.
sql = sql.replace(/^ALTER\s+.+?\s+OWNER TO\s+.+?;\s*$/gm, "");

const supabaseRoles = [
  "postgres",
  "supabase_admin",
  "service_role",
  "anon",
  "authenticated",
  "authenticator",
  "dashboard_user",
  "pgbouncer",
  "supabase_auth_admin",
  "supabase_storage_admin",
  "supabase_functions_admin",
  "supabase_read_only_user",
];
const roleAlternation = supabaseRoles.map((r) => `\\"?${r}\\"?`).join("|");
const aclPattern = new RegExp(`^(?:GRANT|REVOKE)\\b.*(?:TO|FROM)\\s+(?:${roleAlternation}).*;\\s*$`, "gm");
sql = sql.replace(aclPattern, "");
const defaultPrivilegesPattern = new RegExp(
  `^ALTER DEFAULT PRIVILEGES FOR ROLE\\s+(?:${roleAlternation}).*;\\s*$`,
  "gm",
);
sql = sql.replace(defaultPrivilegesPattern, "");
const setRolePattern = new RegExp(`^(?:SET ROLE|SET SESSION AUTHORIZATION)\\s+(?:${roleAlternation})\\s*;\\s*$`, "gm");
sql = sql.replace(setRolePattern, "");

// Supabase policies may explicitly target anon/authenticated. Those roles do not
// exist in Neon, and WebForge's Neon connection is server-only, so remove those
// policy statements instead of recreating Supabase's Data API authorization model.
const policyRolePattern = new RegExp(`CREATE POLICY[\\s\\S]*?\\bTO\\s+(?:${roleAlternation})\\b[\\s\\S]*?;\\s*`, "gi");
sql = sql.replace(policyRolePattern, "");

sql = sql.replace(/CHECK \(char_length\(password_hash\) = 64\)/g, "CHECK (char_length(password_hash) IN (60, 64))");

const prelude = [
  "-- Generated from the WebForge Supabase production schema.",
  "-- Neon compatibility adjustments are applied by scripts/prepare-neon-schema.mjs.",
  "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
  "",
].join("\n");
sql = prelude + sql;

const forbidden = ["vault.", "extensions.crypt", "extensions.gen_salt", "extensions.digest", vaultName];
const leftovers = forbidden.filter((needle) => sql.includes(needle));
if (leftovers.length) {
  console.error(`Neon schema still contains Supabase-only references: ${leftovers.join(", ")}`);
  process.exit(2);
}

const missingRoleResidue = new RegExp(
  `(?:OWNER TO|(?:GRANT|REVOKE)\\b.*(?:TO|FROM)|ALTER DEFAULT PRIVILEGES FOR ROLE|SET ROLE|SET SESSION AUTHORIZATION|CREATE POLICY[\\s\\S]*?\\bTO)\\s+(?:${roleAlternation})\\b`,
  "i",
);
if (missingRoleResidue.test(sql)) {
  console.error("Neon schema still contains Supabase role ownership/ACL/policy statements");
  process.exit(4);
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
console.log("Supabase ownership/ACL/policy statements removed: yes");
