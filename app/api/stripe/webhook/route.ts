import { NextResponse } from "next/server";

const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = hex(digest);
  return signatures.some((candidate) => candidate.length === expected.length && candidate === expected);
}

async function sb(path: string, options: RequestInit = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function stripeSubscriptionId(invoice: Record<string, unknown>) {
  if (typeof invoice.subscription === "string") return invoice.subscription;
  const parent = invoice.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  return typeof details?.subscription === "string" ? details.subscription : null;
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return NextResponse.json({ ok: false, error: "Stripe webhook not configured" }, { status: 503 });
    const signature = req.headers.get("stripe-signature") || "";
    const payload = await req.text();
    if (!(await verifyStripeSignature(payload, signature, webhookSecret))) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload) as { id: string; type: string; data: { object: Record<string, unknown> } };
    const insertEvent = await sb("stripe_webhook_events?on_conflict=event_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ event_id: event.id, event_type: event.type }),
    });
    if (!insertEvent.ok) throw new Error(`EVENT_LOG_${insertEvent.status}`);
    const inserted = await insertEvent.json() as unknown[];
    if (inserted.length === 0) return NextResponse.json({ ok: true, duplicate: true });

    const object = event.data.object;

    if (event.type === "checkout.session.completed") {
      const metadata = (object.metadata || {}) as Record<string, unknown>;
      const localId = Number(metadata.webforge_subscription_id);
      if (Number.isSafeInteger(localId) && localId > 0) {
        await sb(`billing_subscriptions?id=eq.${localId}`, {
          method: "PATCH",
          body: JSON.stringify({
            stripe_customer_id: typeof object.customer === "string" ? object.customer : null,
            stripe_subscription_id: typeof object.subscription === "string" ? object.subscription : null,
            status: "active",
            stripe_checkout_url: null,
            updated_at: new Date().toISOString(),
          }),
        });
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const stripeSubId = stripeSubscriptionId(object);
      if (stripeSubId) {
        const lookup = await sb(`billing_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubId)}&select=id`);
        const rows = lookup.ok ? await lookup.json() as { id: number }[] : [];
        const localSubscriptionId = rows[0]?.id;
        if (localSubscriptionId) {
          await sb(`billing_subscriptions?id=eq.${localSubscriptionId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: event.type === "invoice.paid" ? "active" : "past_due", updated_at: new Date().toISOString() }),
          });

          if (event.type === "invoice.paid") {
            const invoices = await sb(`invoices?recurring_subscription_id=eq.${localSubscriptionId}&status=in.(open,overdue)&order=issue_date.desc&limit=1&select=id`);
            const invoiceRows = invoices.ok ? await invoices.json() as { id: number }[] : [];
            const invoiceId = invoiceRows[0]?.id;
            const amountPaid = Number(object.amount_paid || 0);
            if (invoiceId && Number.isSafeInteger(amountPaid) && amountPaid > 0) {
              const stripeInvoiceId = typeof object.id === "string" ? object.id : null;
              const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
              await sb(`invoices?id=eq.${invoiceId}`, {
                method: "PATCH",
                body: JSON.stringify({ stripe_invoice_id: stripeInvoiceId, stripe_payment_intent_id: paymentIntent, updated_at: new Date().toISOString() }),
              });
              await sb("payments", {
                method: "POST",
                headers: { Prefer: "return=minimal" },
                body: JSON.stringify({ invoice_id: invoiceId, amount_cents: amountPaid, method: "stripe", reference: stripeInvoiceId || event.id, paid_at: new Date().toISOString() }),
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WEBFORGE_STRIPE_WEBHOOK_ERROR", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
