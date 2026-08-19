import { NextResponse } from "next/server";
export async function POST(req:Request){
  try{const body=await req.json();const company=String(body.company||"").trim();const email=String(body.email||"").trim();const website=String(body.website||"").trim();if(company.length<2||!email.includes("@"))return NextResponse.json({ok:false,error:"Bitte Unternehmen und gültige E-Mail angeben."},{status:400});
  // Persistence adapter follows once a dedicated WebForge database is available.
  console.info("WEBFORGE_LEAD",{company,email,website,createdAt:new Date().toISOString()});return NextResponse.json({ok:true});}catch{return NextResponse.json({ok:false,error:"Ungültige Anfrage."},{status:400});}}
