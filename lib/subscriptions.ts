export type BillingSubscriptionStatus = "active" | "paused" | "past_due" | "cancelled";

export type BillingSubscription = {
  id: number;
  lead_id: number;
  project_id: number | null;
  name: string;
  amount_cents: number;
  tax_percent: number;
  interval: "monthly";
  status: BillingSubscriptionStatus;
  next_invoice_date: string;
  last_invoice_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_checkout_url: string | null;
  company: string;
  email: string;
  project_number: string | null;
  created_at: string;
};

const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";

function headers() {
  return { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" };
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: headers(), body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`WEBFORGE_SUBSCRIPTION_RPC_${name}`, response.status, detail);
    if ([400, 401, 403].includes(response.status)) throw new Error("UNAUTHORIZED");
    throw new Error("SUBSCRIPTION_RPC_FAILED");
  }
  return response;
}

export async function listBillingSubscriptions(password: string): Promise<BillingSubscription[]> {
  const response = await rpc("admin_list_billing_subscriptions", { p_password: password });
  return (await response.json()) as BillingSubscription[];
}

export async function createBillingSubscription(password: string, input: { leadId: number; projectId?: number | null; name: string; amountCents: number; taxPercent: number; nextInvoiceDate: string }) {
  const response = await rpc("admin_create_billing_subscription", {
    p_password: password,
    p_lead_id: input.leadId,
    p_project_id: input.projectId || null,
    p_name: input.name,
    p_amount_cents: input.amountCents,
    p_tax_percent: input.taxPercent,
    p_next_invoice_date: input.nextInvoiceDate,
  });
  return (await response.json()) as number;
}

export async function setBillingSubscriptionStatus(password: string, subscriptionId: number, status: BillingSubscriptionStatus) {
  await rpc("admin_set_billing_subscription_status", { p_password: password, p_subscription_id: subscriptionId, p_status: status });
}

export async function generateDueRecurringInvoices(password: string, asOf?: string) {
  const response = await rpc("admin_generate_due_recurring_invoices", { p_password: password, p_as_of: asOf || null });
  return (await response.json()) as { subscription_id: number; invoice_id: number; invoice_number: string }[];
}

export async function setBillingSubscriptionStripe(password: string, subscriptionId: number, input: { customerId?: string; stripeSubscriptionId?: string; priceId?: string; checkoutUrl?: string }) {
  await rpc("admin_set_billing_subscription_stripe", {
    p_password: password,
    p_subscription_id: subscriptionId,
    p_customer_id: input.customerId || "",
    p_subscription_stripe_id: input.stripeSubscriptionId || "",
    p_price_id: input.priceId || "",
    p_checkout_url: input.checkoutUrl || "",
  });
}
