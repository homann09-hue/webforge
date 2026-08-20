import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS=new Set(["https://webforge-virid.vercel.app"]);
function cors(origin:string|null){const allowed=origin&&ALLOWED_ORIGINS.has(origin)?origin:"https://webforge-virid.vercel.app";return{"Access-Control-Allow-Origin":allowed,"Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};}
function json(data:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}})}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json({ok:false,error:"origin_not_allowed"},403,origin);
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405,origin);
  try{
    const body=await req.json();
    const action=String(body.action||"");
    const token=String(body.token||"");
    if(token.length<40||token.length>128)return json({ok:false,error:"invalid_portal_token"},401,origin);
    const url=Deno.env.get("SUPABASE_URL")!;
    const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db=createClient(url,serviceKey,{auth:{persistSession:false}});
    if(action==="get"){
      const {data,error}=await db.rpc("portal_get_project",{p_token:token});
      if(error)return json({ok:false,error:"invalid_or_expired_portal"},401,origin);
      return json({ok:true,project:data},200,origin);
    }
    if(action==="submit"){
      const kind=String(body.kind||"");const label=String(body.label||"");const content=String(body.content||"");
      if(!["text","link"].includes(kind))return json({ok:false,error:"invalid_submission"},400,origin);
      const {data,error}=await db.rpc("portal_submit",{p_token:token,p_kind:kind,p_label:label,p_content:content});
      if(error){const m=error.message||"";if(/rate_limited/i.test(m))return json({ok:false,error:"rate_limited"},429,origin);if(/invalid_portal_token/i.test(m))return json({ok:false,error:"invalid_or_expired_portal"},401,origin);return json({ok:false,error:"invalid_submission"},400,origin)}
      return json({ok:true,id:data},201,origin);
    }
    return json({ok:false,error:"invalid_action"},400,origin);
  }catch(error){console.error("WEBFORGE_PORTAL_GATEWAY_ERROR",error);return json({ok:false,error:"internal_error"},500,origin)}
});
