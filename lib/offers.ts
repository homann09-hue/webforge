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

const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";

function headers() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`WEBFORGE_OFFER_RPC_${name}`, response.status, detail);
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    throw new Error("OFFER_RPC_FAILED");
  }
  return response;
}

export async function listOffers(password: string, leadId?: number): Promise<Offer[]> {
  const response = await rpc("admin_list_offers", { p_password: password, p_lead_id: leadId ?? null });
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
  const response = await rpc("admin_create_offer", {
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
  await rpc("admin_update_offer_status", { p_password: password, p_offer_id: offerId, p_status: status });
}

export async function deleteOffer(password: string, offerId: number) {
  await rpc("admin_delete_offer", { p_password: password, p_offer_id: offerId });
}
