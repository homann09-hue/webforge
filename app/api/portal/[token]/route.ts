import { NextResponse } from "next/server";
import { getPortalProject, submitPortal } from "@/lib/portal";

export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){try{const {token}=await params;const project=await getPortalProject(token);return NextResponse.json({ok:true,project});}catch{return NextResponse.json({ok:false,error:"Portal-Link ungültig oder deaktiviert."},{status:404});}}

export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){try{const {token}=await params;const body=await req.json();const kind=String(body.kind||"") as "text"|"link";const label=String(body.label||"").trim();const content=String(body.content||"").trim();if(!["text","link"].includes(kind)||!label||!content)return NextResponse.json({ok:false,error:"Angaben fehlen."},{status:400});await submitPortal(token,kind,label,content);return NextResponse.json({ok:true},{status:201});}catch{return NextResponse.json({ok:false,error:"Abgabe konnte nicht gespeichert werden."},{status:400});}}
