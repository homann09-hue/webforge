import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://webforge-virid.vercel.app"]);
function cors(origin:string|null){const allowed=origin&&ALLOWED_ORIGINS.has(origin)?origin:"https://webforge-virid.vercel.app";return{"Access-Control-Allow-Origin":allowed,"Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-forwarded-for","Access-Control-Allow-Methods":"POST, OPTIONS"};}
function json(data:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}})}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json({ok:false,error:"origin_not_allowed"},403,origin);
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405,origin);
  try{
    const body=await req.json();
    const company=String(body.company||"").trim();
    const email=String(body.email||"").trim();
    const website=String(body.website||"").trim();
    // The rate limit in internal_submit_lead is keyed on this IP. When the
    // caller is our own Next.js route handler (server side), the socket IP is
    // Vercel's, which would put every visitor in one shared bucket of 5 per
    // hour. The route handler therefore forwards the real client address in
    // `clientIp`, and we prefer it over the transport headers.
    const forwardedByCaller=typeof body.clientIp==="string"?body.clientIp.trim():"";
    const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip=forwardedByCaller||forwarded||req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip");
    if(!ip)return json({ok:false,error:"request_unavailable"},400,origin);
    const url=Deno.env.get("SUPABASE_URL")!;
    const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db=createClient(url,serviceKey,{auth:{persistSession:false}});
    const {data,error}=await db.rpc("internal_submit_lead",{p_company:company,p_email:email,p_website:website||null,p_ip:ip});
    if(error){
      const message=error.message||"";
      if(/rate_limited/i.test(message))return json({ok:false,error:"Zu viele Anfragen. Bitte später erneut versuchen."},429,origin);
      if(/invalid_/i.test(message))return json({ok:false,error:"Bitte Angaben prüfen."},400,origin);
      console.error("WEBFORGE_LEAD_SUBMIT_RPC_ERROR",error.code,error.message);
      return json({ok:false,error:"Anfrage konnte nicht gespeichert werden."},500,origin);
    }
    return json({ok:true,id:data},201,origin);
  }catch(error){console.error("WEBFORGE_LEAD_SUBMIT_ERROR",error);return json({ok:false,error:"Anfrage konnte nicht gespeichert werden."},500,origin)}
});
