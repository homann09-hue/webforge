import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) {
  console.error("DATABASE_URL or DATABASE_URL_UNPOOLED is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);
const rows = await sql`
  select
    current_database()::text as database,
    (select count(*)::int from public.leads) as leads,
    (select count(*)::int from public.admin_config) as admin_config,
    (select count(*)::int from public.app_config) as app_config
`;

const row = rows[0];
if (!row) {
  console.error("Neon smoke query returned no rows");
  process.exit(2);
}

if (Number(row.admin_config) !== 1 || Number(row.app_config) !== 1) {
  console.error("Neon smoke failed: expected admin_config=1 and app_config=1", row);
  process.exit(3);
}

console.log("Neon smoke OK", {
  database: row.database,
  leads: Number(row.leads),
  admin_config: Number(row.admin_config),
  app_config: Number(row.app_config),
});
