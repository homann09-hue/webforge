const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";

const headers = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  "Content-Type": "application/json",
};

export async function adminRpc(name: string, body: Record<string, unknown>) {
  const password = String(body.p_password || "");
  const args = Object.fromEntries(Object.entries(body).filter(([key]) => key !== "p_password"));
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_gateway`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_password: password, p_function: name, p_args: args }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`WEBFORGE_ADMIN_GATEWAY_${name}`, response.status, detail);
    if ([400, 401, 403, 429].includes(response.status)) throw new Error("UNAUTHORIZED");
    throw new Error("ADMIN_RPC_FAILED");
  }
  return response;
}
