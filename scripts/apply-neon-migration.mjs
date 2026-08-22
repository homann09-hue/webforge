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
} catch (error) {
  console.error(
    checkOnly ? "Migrationsprüfung fehlgeschlagen:" : "Migration fehlgeschlagen:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
