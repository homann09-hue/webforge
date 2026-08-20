import { NextResponse } from "next/server";

/**
 * The client caps quantities too, but a route handler cannot rely on that.
 * lineTotalCents(1e6, 1e10) already exceeds Number.MAX_SAFE_INTEGER, so an
 * unbounded quantity is an overflow, not just an odd number.
 */
const MAX_SERVER_QUANTITY = 1_000_000;
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { createOffer, deleteOffer, listOffers, updateOfferStatus, type OfferStatus } from "@/lib/offers";

const allowedStatuses: OfferStatus[] = ["draft", "sent", "accepted", "rejected"];
type OfferItemInput = { description: string; quantity: number; unit: string; unitPriceCents: number };

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const action = String(body.action || "list");

    if (action === "list") {
      const leadId = body.leadId == null ? undefined : Number(body.leadId);
      if (leadId !== undefined && (!Number.isSafeInteger(leadId) || leadId <= 0)) {
        return NextResponse.json({ ok: false, error: "Ungültiger Lead." }, { status: 400 });
      }
      const offers = await listOffers(session, leadId);
      return NextResponse.json({ ok: true, offers });
    }

    if (action === "create") {
      const leadId = Number(body.leadId);
      const title = String(body.title || "").trim();
      const discountPercent = Number(body.discountPercent ?? 0);
      const taxPercent = Number(body.taxPercent ?? 19);
      const validUntil = String(body.validUntil || "").trim();
      const notes = String(body.notes || "").trim();
      const rawItems: unknown[] = Array.isArray(body.items) ? body.items : [];
      const items: OfferItemInput[] = rawItems.map((raw) => {
        const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
        return {
          description: String(item.description || "").trim(),
          quantity: Number(item.quantity ?? 1),
          unit: String(item.unit || "Stk.").trim() || "Stk.",
          unitPriceCents: Number(item.unitPriceCents ?? 0),
        };
      });

      if (
        !Number.isSafeInteger(leadId) ||
        leadId <= 0 ||
        title.length < 2 ||
        title.length > 160 ||
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100 ||
        !Number.isFinite(taxPercent) ||
        taxPercent < 0 ||
        taxPercent > 100 ||
        items.length < 1 ||
        items.length > 50 ||
        items.some(
          (item) =>
            !item.description ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0 ||
            item.quantity > MAX_SERVER_QUANTITY ||
            !Number.isSafeInteger(item.unitPriceCents) ||
            item.unitPriceCents < 0,
        )
      ) {
        return NextResponse.json({ ok: false, error: "Angebotsdaten sind ungültig." }, { status: 400 });
      }

      const offerId = await createOffer(session, {
        leadId,
        title,
        discountPercent,
        taxPercent,
        validUntil,
        notes,
        items,
      });
      return NextResponse.json({ ok: true, offerId }, { status: 201 });
    }

    if (action === "status") {
      const offerId = Number(body.offerId);
      const status = String(body.status || "") as OfferStatus;
      if (!Number.isSafeInteger(offerId) || offerId <= 0 || !allowedStatuses.includes(status)) {
        return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
      }
      await updateOfferStatus(session, offerId, status);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const offerId = Number(body.offerId);
      if (!Number.isSafeInteger(offerId) || offerId <= 0) {
        return NextResponse.json({ ok: false, error: "Ungültiges Angebot." }, { status: 400 });
      }
      await deleteOffer(session, offerId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error, "Angebot konnte nicht verarbeitet werden.");
  }
}
