import { adminRpc } from "@/lib/admin-rpc";

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

export async function listBillingSubscriptions(session: string): Promise<BillingSubscription[]> {
  const response = await adminRpc("admin_list_billing_subscriptions", session);
  return (await response.json()) as BillingSubscription[];
}

export async function createBillingSubscription(
  session: string,
  input: {
    leadId: number;
    projectId?: number | null;
    name: string;
    amountCents: number;
    taxPercent: number;
    nextInvoiceDate: string;
  },
) {
  const response = await adminRpc("admin_create_billing_subscription", session, {
    p_lead_id: input.leadId,
    p_project_id: input.projectId || null,
    p_name: input.name,
    p_amount_cents: input.amountCents,
    p_tax_percent: input.taxPercent,
    p_next_invoice_date: input.nextInvoiceDate,
  });
  return (await response.json()) as number;
}

export async function setBillingSubscriptionStatus(
  session: string,
  subscriptionId: number,
  status: BillingSubscriptionStatus,
) {
  await adminRpc("admin_set_billing_subscription_status", session, {
    p_subscription_id: subscriptionId,
    p_status: status,
  });
}

export async function generateDueRecurringInvoices(session: string, asOf?: string) {
  const response = await adminRpc("admin_generate_due_recurring_invoices", session, { p_as_of: asOf || null });
  return (await response.json()) as { subscription_id: number; invoice_id: number; invoice_number: string }[];
}

export async function setBillingSubscriptionStripe(
  session: string,
  subscriptionId: number,
  input: { customerId?: string; stripeSubscriptionId?: string; priceId?: string; checkoutUrl?: string },
) {
  await adminRpc("admin_set_billing_subscription_stripe", session, {
    p_subscription_id: subscriptionId,
    p_customer_id: input.customerId || "",
    p_subscription_stripe_id: input.stripeSubscriptionId || "",
    p_price_id: input.priceId || "",
    p_checkout_url: input.checkoutUrl || "",
  });
}
