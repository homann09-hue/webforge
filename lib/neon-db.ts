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
  const result = await sql`
    select
      current_database()::text as database,
      (select count(*)::int from public.leads) as leads,
      (select count(*)::int from public.admin_config) as admin_config
  `;

  const row =
    Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === "object"
      ? (result[0] as Record<string, unknown>)
      : undefined;
  if (!row) throw new Error("Neon health query returned no rows");

  return {
    ok: true,
    database: String(row.database ?? ""),
    leads: Number(row.leads ?? 0),
    adminConfig: Number(row.admin_config ?? 0),
  };
}
