import { NextResponse } from "next/server";
import { addPayment, createInvoice, deleteInvoice, listInvoices, setInvoiceStatus, type InvoiceType, type PaymentMethod } from "@/lib/billing";

const invoiceTypes: InvoiceType[] = ["setup", "monthly", "custom"];
const paymentMethods: PaymentMethod[] = ["bank_transfer", "cash", "stripe", "paypal", "other"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const action = String(body.action || "list");
    if (!password) return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });

    if (action === "list") {
      return NextResponse.json({ ok: true, invoices: await listInvoices(password) });
    }

    if (action === "create") {
      const leadId = Number(body.leadId);
      const projectId = body.projectId == null || body.projectId === "" ? null : Number(body.projectId);
      const invoiceType = String(body.invoiceType || "custom") as InvoiceType;
      const title = String(body.title || "").trim();
      const issueDate = String(body.issueDate || "").trim();
      const dueDate = String(body.dueDate || "").trim();
      const taxPercent = Number(body.taxPercent ?? 19);
      const notes = String(body.notes || "").trim();
      const rawItems = Array.isArray(body.items) ? body.items : [];
      const items = rawItems.map((item: Record<string, unknown>) => ({
        description: String(item.description || "").trim(), quantity: Number(item.quantity ?? 1), unit: String(item.unit || "Stk.").trim() || "Stk.", unitPriceCents: Number(item.unitPriceCents ?? 0),
      }));
      const invalidItem = items.some((item: { description: string; quantity: number; unit: string; unitPriceCents: number }) => !item.description || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0);
      if (!Number.isSafeInteger(leadId) || leadId <= 0 || (projectId !== null && (!Number.isSafeInteger(projectId) || projectId <= 0)) || !invoiceTypes.includes(invoiceType) || title.length < 2 || title.length > 180 || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100 || items.length < 1 || items.length > 50 || invalidItem) {
        return NextResponse.json({ ok: false, error: "Rechnungsdaten sind ungültig." }, { status: 400 });
      }
      const invoiceId = await createInvoice(password, { leadId, projectId, invoiceType, title, issueDate, dueDate, taxPercent, notes, items });
      return NextResponse.json({ ok: true, invoiceId }, { status: 201 });
    }

    if (action === "status") {
      const invoiceId = Number(body.invoiceId);
      const status = String(body.status || "");
      if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0 || !["draft","open","void"].includes(status)) return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
      await setInvoiceStatus(password, invoiceId, status as "draft" | "open" | "void");
      return NextResponse.json({ ok: true });
    }

    if (action === "payment") {
      const invoiceId = Number(body.invoiceId);
      const amountCents = Number(body.amountCents);
      const method = String(body.method || "bank_transfer") as PaymentMethod;
      const reference = String(body.reference || "").trim();
      const paidAt = String(body.paidAt || "").trim();
      if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0 || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !paymentMethods.includes(method)) return NextResponse.json({ ok: false, error: "Zahlungsdaten sind ungültig." }, { status: 400 });
      await addPayment(password, invoiceId, amountCents, method, reference, paidAt);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const invoiceId = Number(body.invoiceId);
      if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) return NextResponse.json({ ok: false, error: "Ungültige Rechnung." }, { status: 400 });
      await deleteInvoice(password, invoiceId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_INVOICES_API_ERROR", error);
    return NextResponse.json({ ok: false, error: "Rechnung konnte nicht verarbeitet werden." }, { status: 500 });
  }
}
