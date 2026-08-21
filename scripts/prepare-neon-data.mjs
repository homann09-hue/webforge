import fs from "node:fs";
import path from "node:path";

const input = process.argv[2] || "migration-backup/supabase-data.sql";
const output = process.argv[3] || "migration-backup/neon-data.sql";

if (!fs.existsSync(input)) {
  console.error(`Input data dump not found: ${input}`);
  process.exit(1);
}

let sql = fs.readFileSync(input, "utf8");

// Supabase data dumps may try to disable triggers/FKs globally by setting
// session_replication_role=replica. Neon-managed roles are not superusers and
// cannot change this parameter, so remove those SET/RESET statements.
sql = sql.replace(/^SET\s+session_replication_role\s*=\s*[^;]+;\s*$/gim, "");
sql = sql.replace(/^RESET\s+session_replication_role\s*;\s*$/gim, "");

// Remove role/session authorization statements that refer to Supabase roles.
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
const setRolePattern = new RegExp(`^(?:SET ROLE|SET SESSION AUTHORIZATION)\\s+(?:${roleAlternation})\\s*;\\s*$`, "gmi");
sql = sql.replace(setRolePattern, "");

// Hard fail if forbidden privilege-changing statements survived.
const forbiddenPatterns = [
  /session_replication_role/i,
  new RegExp(`(?:SET ROLE|SET SESSION AUTHORIZATION)\\s+(?:${roleAlternation})`, "i"),
];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(sql)) {
    console.error(`Neon data dump still contains forbidden statement matching ${pattern}`);
    process.exit(2);
  }
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, sql);
console.log(`Wrote ${output}`);
console.log("Removed Supabase-only session/role statements: yes");
