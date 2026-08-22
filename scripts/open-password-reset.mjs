import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import process from "node:process";
import { Pool } from "@neondatabase/serverless";

const email = String(process.argv[2] || "")
  .trim()
  .toLowerCase();
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const baseUrl = new URL(process.env.WEBFORGE_BASE_URL || "https://webforge-virid.vercel.app");

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !databaseUrl) {
  console.error("Aufruf: node scripts/open-password-reset.mjs <email>");
  process.exit(2);
}
if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
  console.error("WEBFORGE_BASE_URL muss eine sichere HTTPS-Adresse sein.");
  process.exit(2);
}

const rawToken = `wfr_${randomBytes(32).toString("hex")}`;
const tokenHash = createHash("sha256").update(rawToken).digest("hex");
const pool = new Pool({ connectionString: databaseUrl });

try {
  const result = await pool.query(
    `insert into private.user_password_resets(token_hash, user_id, expires_at)
     select $1, id, now() + interval '15 minutes'
       from private.admin_users
      where lower(email) = lower($2) and active = true
     returning user_id`,
    [tokenHash, email],
  );
  if (result.rowCount !== 1) throw new Error("Aktiver Benutzer wurde nicht gefunden.");
  await pool.query(
    `delete from private.user_password_resets
      where expires_at < now() or (used_at is not null and used_at < now() - interval '1 minute')`,
  );

  const target = new URL("/api/admin/password-reset", baseUrl);
  target.searchParams.set("token", rawToken);
  const opener = spawn("open", [target.toString()], { detached: true, stdio: "ignore" });
  opener.unref();
  console.log("Sicheres Passwortfenster geöffnet. Der Einmal-Link ist 15 Minuten gültig.");
} catch (error) {
  console.error("Passwortfenster konnte nicht geöffnet werden:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
