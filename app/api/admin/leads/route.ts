import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { listLeads } from "@/lib/leads";

export async function POST() {
  try {
    const session = await requireAdminSession();
    const leads = await listLeads(session, 50);
    return NextResponse.json({ ok: true, leads });
  } catch (error) {
    return adminErrorResponse(error, "Leads konnten nicht geladen werden.");
  }
}
