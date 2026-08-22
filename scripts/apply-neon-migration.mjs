import { readFile } from "node:fs/promises";
import process from "node:process";
import { Pool } from "@neondatabase/serverless";

const migration = process.argv[2];
const confirmed = process.argv.includes("--confirm");
const checkOnly = process.argv.includes("--check");

if (!migration || !/^migration\/neon\/[a-zA-Z0-9_.-]+\.sql$/.test(migration)) {
  console.error("Aufruf: node scripts/apply-neon-migration.mjs migration/neon/<datei>.sql (--check | --confirm)");
  process.exit(2);
}

if (confirmed === checkOnly) {
  console.error("Genau ein Modus ist erforderlich: --check oder --confirm.");
  process.exit(2);
}

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL_UNPOOLED oder DATABASE_URL fehlt.");
  process.exit(2);
}

const pool = new Pool({ connectionString: databaseUrl });

async function verifyMultiUserSchema() {
  const { rows } = await pool.query(`
    select
      to_regclass('private.admin_users') is not null as admin_users,
      to_regclass('private.user_sessions') is not null as user_sessions,
      to_regprocedure('public.internal_user_session_lookup(text)') is not null as session_lookup,
      to_regprocedure('public.internal_user_create_session(text,text)') is not null as create_session
  `);
  const row = rows[0];
  if (!row || !row.admin_users || !row.user_sessions || !row.session_lookup || !row.create_session) {
    throw new Error("Multi-User-Verifikation ist unvollständig.");
  }
  console.log("Multi-User-Schema verifiziert.");
}

async function verifyMultiUserAdminBridge() {
  const { rows } = await pool.query(`
    select pg_get_functiondef(to_regprocedure('private.assert_admin_credential(text)')) as credential_definition,
           pg_get_functiondef(to_regprocedure('public.internal_user_create_session(text,text)')) as login_definition
  `);
  const credentialDefinition = rows[0]?.credential_definition || "";
  const loginDefinition = rows[0]?.login_definition || "";
  if (
    !credentialDefinition.includes("private.user_sessions") ||
    !credentialDefinition.includes("'owner', 'admin'") ||
    !loginDefinition.includes("private.admin_gateway_failures") ||
    !loginDefinition.includes("return null")
  ) {
    throw new Error("Multi-User-Adminbrücke ist unvollständig.");
  }
  console.log("Multi-User-Adminbrücke verifiziert.");
}

async function verifyPasswordResetLinks() {
  const { rows } = await pool.query(`
    select to_regclass('private.user_password_resets') is not null as reset_table,
           pg_get_functiondef(to_regprocedure('public.internal_user_complete_password_reset(text,text)')) as reset_definition
  `);
  const definition = rows[0]?.reset_definition || "";
  if (
    !rows[0]?.reset_table ||
    !definition.includes("private.user_password_resets") ||
    !definition.includes("private.user_sessions") ||
    !definition.includes("gen_salt('bf', 12)")
  ) {
    throw new Error("Einmal-Passwort-Reset ist unvollständig.");
  }
  console.log("Einmal-Passwort-Reset verifiziert.");
}

try {
  if (checkOnly) {
    console.log(`Prüfe Migration ohne Schreibzugriff: ${migration}`);
  } else {
    const source = await readFile(migration, "utf8");
    if (!source.trim()) throw new Error(`Migration ist leer: ${migration}`);

    console.log(`Wende Migration an: ${migration}`);
    await pool.query(source);
    console.log("Migration erfolgreich ausgeführt.");
  }

  if (migration.endsWith("001_multi_user_auth.sql")) {
    await verifyMultiUserSchema();
  }
  if (migration.endsWith("002_multi_user_admin_bridge.sql")) {
    await verifyMultiUserAdminBridge();
  }
  if (migration.endsWith("003_password_reset_links.sql")) {
    await verifyPasswordResetLinks();
  }
} catch (error) {
  console.error(
    checkOnly ? "Migrationsprüfung fehlgeschlagen:" : "Migration fehlgeschlagen:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
