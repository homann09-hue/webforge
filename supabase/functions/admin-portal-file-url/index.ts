import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://webforge-virid.vercel.app"]);

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://webforge-virid.vercel.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const json = (body: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok:false,error:"origin_not_allowed" },403,origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ ok:false,error:"method_not_allowed" },405,origin);

  try {
    const { password, submissionId } = await req.json();
    const credential = String(password || "");
    const id = Number(submissionId);
    if (!credential || !Number.isSafeInteger(id) || id <= 0) return json({ ok:false,error:"invalid_request" },400,origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession:false } });

    // Accept either a session token or the raw password, exactly like
    // admin-gateway does. Before this, only the password branch existed, so
    // every call from the app - which sends a session token - failed with 401
    // and the "open file" button in the admin area never worked.
    let valid = false;
    if (/^wfs_[0-9a-f]{64}$/.test(credential)) {
      const { data, error } = await db.rpc("internal_admin_validate_session", { p_token: credential });
      valid = error ? false : data === true;
    } else {
      const { data, error } = await db.rpc("internal_admin_validate_password", { p_password: credential });
      valid = error ? false : data === true;
    }
    if (!valid) return json({ ok:false,error:"unauthorized" },401,origin);

    const { data: submission, error: subErr } = await db.from("portal_submissions").select("id,file_path,file_name").eq("id",id).single();
    if (subErr || !submission?.file_path) return json({ ok:false,error:"file_not_found" },404,origin);

    const { data:signed, error:signErr } = await db.storage.from("webforge-portal").createSignedUrl(submission.file_path,120,{download:submission.file_name || true});
    if (signErr || !signed?.signedUrl) return json({ ok:false,error:"sign_failed" },500,origin);
    return json({ ok:true,url:signed.signedUrl,expiresIn:120 },200,origin);
  } catch (err) {
    console.error("WEBFORGE_ADMIN_FILE_URL_ERROR", err);
    return json({ ok:false,error:"internal_error" },500,origin);
  }
});
