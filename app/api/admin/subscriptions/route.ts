import { NextResponse } from "next/server";
import {
  createBillingSubscription,
  generateDueRecurringInvoices,
  listBillingSubscriptions,
  setBillingSubscriptionStatus,
  type BillingSubscriptionStatus,
} from "@/lib/subscriptions";

const statuses: BillingSubscriptionStatus[] = ["active", "paused", "past_due", "cancelled"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const action = String(body.action || "list");
    if (!password) return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });

    if (action === "list") {
      return NextResponse.json({ ok: true, subscriptions: await listBillingSubscriptions(password) });
    }

    if (action === "create") {
      const leadId = Number(body.leadId);
      const projectId = body.projectId == null || body.projectId === "" ? null : Number(body.projectId);
      const name = String(body.name || "").trim();
      const amountCents = Number(body.amountCents);
      const taxPercent = Number(body.taxPercent ?? 19);
      const nextInvoiceDate = String(body.nextInvoiceDate || "");
      if (!Number.isSafeInteger(leadId) || leadId <= 0 || (projectId !== null && (!Number.isSafeInteger(projectId) || projectId <= 0)) || name.length < 2 || name.length > 180 || !Number.isSafeInteger(amountCents) || amountCents < 0 || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(nextInvoiceDate)) {
        return NextResponse.json({ ok: false, error: "Abo-Daten sind ungültig." }, { status: 400 });
      }
      const id = await createBillingSubscription(password, { leadId, projectId, name, amountCents, taxPercent, nextInvoiceDate });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (action === "status") {
      const subscriptionId = Number(body.subscriptionId);
      const status = String(body.status || "") as BillingSubscriptionStatus;
      if (!Number.isSafeInteger(subscriptionId) || subscriptionId <= 0 || !statuses.includes(status)) {
        return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
      }
      await setBillingSubscriptionStatus(password, subscriptionId, status);
      return NextResponse.json({ ok: true });
    }

    if (action === "generate") {
      const asOf = body.asOf ? String(body.asOf) : undefined;
      if (asOf && !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return NextResponse.json({ ok: false, error: "Datum ist ungültig." }, { status: 400 });
      const generated = await generateDueRecurringInvoices(password, asOf);
      return NextResponse.json({ ok: true, generated });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_SUBSCRIPTIONS_API_ERROR", error);
    return NextResponse.json({ ok: false, error: "Abo konnte nicht verarbeitet werden." }, { status: 500 });
  }
}
