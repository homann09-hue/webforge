import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://webforge-virid.vercel.app"]);
function cors(origin:string|null){const allowed=origin&&ALLOWED_ORIGINS.has(origin)?origin:"https://webforge-virid.vercel.app";return{"Access-Control-Allow-Origin":allowed,"Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};}
function json(data:unknown,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}})}
function entityType(fn:string){if(fn.includes("lead"))return"lead";if(fn.includes("offer"))return"offer";if(fn.includes("project"))return"project";if(fn.includes("invoice")||fn.includes("payment"))return"billing";if(fn.includes("subscription"))return"subscription";if(fn.includes("submission"))return"submission";return"admin";}

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&!ALLOWED_ORIGINS.has(origin))return json({error:"origin_not_allowed"},403,origin);
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405,origin);
 try{
  const body=await req.json();
  const credential=String(body.password||body.credential||"");
  const fn=String(body.function||"");
  const args=body.args&&typeof body.args==="object"?body.args as Record<string,unknown>:{};
  if(!credential||!/^admin_[a-z0-9_]+$/.test(fn)||fn.startsWith("admin_internal"))return json({error:"invalid_request"},400,origin);
  const url=Deno.env.get("SUPABASE_URL")!;const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;const db=createClient(url,serviceKey,{auth:{persistSession:false}});
  let valid=false;
  if(/^wfs_[0-9a-f]{64}$/.test(credential)){
    const r=await db.rpc("internal_admin_validate_session",{p_token:credential});valid=r.error?false:r.data===true;
  }else{
    const r=await db.rpc("internal_admin_validate_password",{p_password:credential});valid=r.error?false:r.data===true;
  }
  if(!valid)return json({error:"unauthorized"},401,origin);
  const payload={p_password:credential,...args};
  const {data,error}=await db.rpc(fn,payload);
  if(error){console.error("WEBFORGE_ADMIN_GATEWAY_RPC_ERROR",fn,error.code,error.message);const status=/not_found|invalid|unauthorized/i.test(error.message||"")?400:500;return json({error:status===400?"invalid_request":"operation_failed"},status,origin)}
  const idEntry=Object.entries(args).find(([key])=>key.endsWith("_id")&&args[key]!=null);
  await db.from("admin_audit_log").insert({action:fn,entity_type:entityType(fn),entity_id:idEntry?String(idEntry[1]):null,actor:"admin",metadata:{keys:Object.keys(args),status:args.p_status??null}}).then(()=>{});
  return json(data,200,origin);
 }catch(error){console.error("WEBFORGE_ADMIN_GATEWAY_ERROR",error);return json({error:"internal_error"},500,origin)}
});
