import { adminRpc } from "@/lib/admin-rpc";

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected";

export type OfferItem = {
  id: number;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
};

export type Offer = {
  id: number;
  lead_id: number;
  offer_number: string;
  title: string;
  status: OfferStatus;
  discount_percent: number;
  tax_percent: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company: string;
  contact_name: string | null;
  email: string;
  items: OfferItem[];
  subtotal_cents: number;
  discount_cents: number;
  net_cents: number;
  tax_cents: number;
  gross_cents: number;
};

export async function listOffers(password: string, leadId?: number): Promise<Offer[]> {
  const response = await adminRpc("admin_list_offers", { p_password: password, p_lead_id: leadId ?? null });
  return (await response.json()) as Offer[];
}

export async function createOffer(password: string, input: {
  leadId: number;
  title: string;
  discountPercent: number;
  taxPercent: number;
  validUntil?: string;
  notes?: string;
  items: Array<{ description: string; quantity: number; unit: string; unitPriceCents: number }>;
}): Promise<number> {
  const response = await adminRpc("admin_create_offer", {
    p_password: password,
    p_lead_id: input.leadId,
    p_title: input.title,
    p_discount_percent: input.discountPercent,
    p_tax_percent: input.taxPercent,
    p_valid_until: input.validUntil || null,
    p_notes: input.notes || null,
    p_items: input.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price_cents: item.unitPriceCents,
    })),
  });
  return await response.json() as number;
}

export async function updateOfferStatus(password: string, offerId: number, status: OfferStatus) {
  await adminRpc("admin_update_offer_status", { p_password: password, p_offer_id: offerId, p_status: status });
}

export async function deleteOffer(password: string, offerId: number) {
  await adminRpc("admin_delete_offer", { p_password: password, p_offer_id: offerId });
}
