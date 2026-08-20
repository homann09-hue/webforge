/**
 * Central Supabase configuration.
 *
 * These two values are safe to ship to the browser: the publishable key only
 * grants what row level security and the Edge Functions allow. They live here
 * rather than inline in six different modules so that pointing the app at a
 * staging project is a matter of setting two environment variables.
 *
 * The fallbacks keep the current production project working when the variables
 * are not set, so existing deployments do not break on upgrade.
 */
const DEFAULT_SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

/** Headers for calling a Supabase Edge Function with the publishable key. */
export function supabaseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Absolute URL of a Supabase Edge Function. */
export function edgeFunctionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}
