import { NextResponse } from "next/server";
import { updateLeadCommercial, type ProposalStatus } from "@/lib/leads";

const allowedProposalStatuses: ProposalStatus[] = ["none", "draft", "sent", "accepted", "rejected"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const leadId = Number(body.leadId);
    const proposalStatus = String(body.proposalStatus || "none") as ProposalStatus;
    const setupPriceCents = Math.round(Number(body.setupPriceCents || 0));
    const monthlyPriceCents = Math.round(Number(body.monthlyPriceCents || 0));

    if (!password || !Number.isInteger(leadId) || leadId <= 0 || !allowedProposalStatuses.includes(proposalStatus) || setupPriceCents < 0 || monthlyPriceCents < 0) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    await updateLeadCommercial(password, leadId, {
      contactName: String(body.contactName || "").slice(0, 160),
      phone: String(body.phone || "").slice(0, 80),
      packageName: String(body.packageName || "").slice(0, 120),
      setupPriceCents,
      monthlyPriceCents,
      proposalStatus,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_ADMIN_COMMERCIAL_ERROR", error);
    return NextResponse.json({ ok: false, error: "Kundendaten konnten nicht gespeichert werden." }, { status: 500 });
  }
}
