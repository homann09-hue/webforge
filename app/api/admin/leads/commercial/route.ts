import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { updateLeadCommercial, type ProposalStatus } from "@/lib/leads";

const allowedProposalStatuses: ProposalStatus[] = ["none", "draft", "sent", "accepted", "rejected"];

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const leadId = Number(body.leadId);
    const proposalStatus = String(body.proposalStatus || "none") as ProposalStatus;
    // Math.round(Number(...)) yields NaN for garbage, and `NaN < 0` is false,
    // so the guard below used to wave it through — JSON.stringify then turned
    // it into null on the way to the database. Every sibling route uses
    // Number.isSafeInteger; this one was missed.
    const setupPriceCents = Math.round(Number(body.setupPriceCents ?? 0));
    const monthlyPriceCents = Math.round(Number(body.monthlyPriceCents ?? 0));

    if (
      !Number.isInteger(leadId) ||
      leadId <= 0 ||
      !allowedProposalStatuses.includes(proposalStatus) ||
      !Number.isSafeInteger(setupPriceCents) ||
      !Number.isSafeInteger(monthlyPriceCents) ||
      setupPriceCents < 0 ||
      monthlyPriceCents < 0
    ) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    await updateLeadCommercial(session, leadId, {
      contactName: String(body.contactName || "").slice(0, 160),
      phone: String(body.phone || "").slice(0, 80),
      packageName: String(body.packageName || "").slice(0, 120),
      setupPriceCents,
      monthlyPriceCents,
      proposalStatus,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error, "Kundendaten konnten nicht gespeichert werden.");
  }
}
