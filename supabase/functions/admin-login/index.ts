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
  const {password}=await req.json();
  if(!password||String(password).length>200)return json({ok:false,error:"invalid_request"},400,origin);
  const url=Deno.env.get("SUPABASE_URL")!;const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;const db=createClient(url,key,{auth:{persistSession:false}});
  const {data,error}=await db.rpc("internal_admin_create_session",{p_password:String(password)});
  if(error||typeof data!=="string")return json({ok:false,error:/rate_limited/i.test(error?.message||"")?"rate_limited":"unauthorized"},/rate_limited/i.test(error?.message||"")?429:401,origin);
  return json({ok:true,token:data,expiresIn:28800},200,origin);
 }catch(error){console.error("WEBFORGE_ADMIN_LOGIN_ERROR",error);return json({ok:false,error:"internal_error"},500,origin)}
});
