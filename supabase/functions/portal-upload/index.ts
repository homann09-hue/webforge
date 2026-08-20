import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://webforge-virid.vercel.app"]);
const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
};

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://webforge-virid.vercel.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok:false,error:"Origin not allowed" }, 403, origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ ok:false,error:"Method not allowed" }, 405, origin);

  try {
    const form = await req.formData();
    const token = String(form.get("token") || "");
    const label = String(form.get("label") || "Datei").trim();
    const file = form.get("file");
    if (!token || token.length < 40 || token.length > 128 || !label || label.length > 120 || !(file instanceof File)) throw new Error("invalid_request");
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error("invalid_file_size");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload";
    const ext = safeName.includes(".") ? safeName.split(".").pop()!.toLowerCase() : "";
    const allowedExts = ALLOWED_TYPES[file.type];
    if (!allowedExts || !allowedExts.includes(ext)) throw new Error("invalid_file_type");

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

    const { data: projectData, error: projectError } = await admin.rpc("portal_get_project", { p_token: token });
    if (projectError || !projectData?.project_id) return json({ ok:false,error:"Ungültiger oder abgelaufener Portal-Link." }, 401, origin);

    const path = `${projectData.project_id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from("webforge-portal").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { error: registerError } = await admin.rpc("portal_register_file", { p_token: token, p_label: label, p_file_path: path, p_file_name: file.name });
    if (registerError) {
      await admin.storage.from("webforge-portal").remove([path]);
      throw registerError;
    }

    return json({ ok:true,fileName:file.name }, 201, origin);
  } catch (error) {
    console.error("WEBFORGE_PORTAL_UPLOAD_ERROR", error);
    return json({ ok:false,error:"Upload fehlgeschlagen. Erlaubt: JPG, PNG, WebP, PDF, TXT bis 10 MB." }, 400, origin);
  }
});
