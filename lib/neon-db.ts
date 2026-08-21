import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function getNeonSql() {
  if (client) return client;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  client = neon(databaseUrl);
  return client;
}

export async function checkNeonConnection(): Promise<{
  ok: true;
  database: string;
  leads: number;
  adminConfig: number;
}> {
  const sql = getNeonSql();
  const rows = await sql`
    select
      current_database()::text as database,
      (select count(*)::int from public.leads) as leads,
      (select count(*)::int from public.admin_config) as admin_config
  `;

  const row = rows[0] as { database: string; leads: number; admin_config: number } | undefined;
  if (!row) throw new Error("Neon health query returned no rows");

  return {
    ok: true,
    database: row.database,
    leads: Number(row.leads),
    adminConfig: Number(row.admin_config),
  };
}
