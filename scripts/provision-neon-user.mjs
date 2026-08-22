import process from "node:process";
import { Pool } from "@neondatabase/serverless";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key?.startsWith("--") || !value) {
    console.error("Aufruf: node scripts/provision-neon-user.mjs --email <email> --name <name> [--role owner|admin]");
    process.exit(2);
  }
  args.set(key.slice(2), value);
}

const email = String(args.get("email") || "")
  .trim()
  .toLowerCase();
const displayName = String(args.get("name") || "").trim();
const role = String(args.get("role") || "owner");
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || displayName.length < 2 || displayName.length > 120) {
  console.error("Bitte eine gültige E-Mail-Adresse und einen Namen mit 2–120 Zeichen angeben.");
  process.exit(2);
}
if (!["owner", "admin"].includes(role)) {
  console.error("Für den Adminbereich sind nur die Rollen owner und admin zulässig.");
  process.exit(2);
}
if (!databaseUrl) {
  console.error("DATABASE_URL_UNPOOLED oder DATABASE_URL fehlt.");
  process.exit(2);
}
if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Die verdeckte Passworteingabe benötigt ein interaktives Terminal.");
  process.exit(2);
}

function hiddenQuestion(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    const previousRawMode = Boolean(input.isRaw);
    let value = "";

    output.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    const cleanup = () => {
      input.removeListener("data", onData);
      input.setRawMode(previousRawMode);
      input.pause();
      output.write("\n");
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Abgebrochen."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else if (character.charCodeAt(0) >= 32) {
          value += character;
        }
      }
    };
    input.on("data", onData);
  });
}

let pool;
try {
  const password = await hiddenQuestion("Neues Passwort (verdeckt): ");
  const confirmation = await hiddenQuestion("Passwort wiederholen (verdeckt): ");
  if (password !== confirmation) throw new Error("Die Passwörter stimmen nicht überein.");
  if (password.length < 14 || password.length > 200) {
    throw new Error("Das Passwort muss 14–200 Zeichen lang sein.");
  }

  pool = new Pool({ connectionString: databaseUrl });
  const result = await pool.query(
    `insert into private.admin_users(email, display_name, role, password_hash)
     values ($1, $2, $3, crypt($4, gen_salt('bf', 12)))
     on conflict ((lower(email))) do update
       set display_name = excluded.display_name,
           role = excluded.role,
           password_hash = excluded.password_hash,
           active = true,
           updated_at = now()
     returning email, display_name, role`,
    [email, displayName, role, password],
  );
  const user = result.rows[0];
  console.log(`Benutzer sicher eingerichtet: ${user.email} (${user.role}, ${user.display_name})`);
} catch (error) {
  console.error("Benutzer konnte nicht eingerichtet werden:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
