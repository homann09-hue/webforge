import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison: `===` on a hex digest leaks, through its timing,
 *  how many leading characters of a forged signature were correct. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sb(path: string, options: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function getWebhookSecret() {
  const response = await sb("rpc/internal_get_stripe_webhook_secret", {
    method: "POST",
    body: "{}",
  });
  if (!response.ok) throw new Error(`WEBHOOK_SECRET_${response.status}`);
  const value = await response.json();
  if (typeof value !== "string" || !value.startsWith("whsec_")) throw new Error("WEBHOOK_SECRET_INVALID");
  return value;
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
  // reduce, not some: do not short-circuit across candidate signatures.
  return signatures.reduce((matched, candidate) => timingSafeEqual(candidate, expected) || matched, false);
}

function stripeSubscriptionId(invoice: Record<string, unknown>) {
  if (typeof invoice.subscription === "string") return invoice.subscription;
  const parent = invoice.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  return typeof details?.subscription === "string" ? details.subscription : null;
}

async function updateSubscriptionByStripeId(stripeSubscriptionId: string, patch: Record<string, unknown>) {
  const lookup = await sb(`billing_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubscriptionId)}&select=id`);
  if (!lookup.ok) return null;
  const rows = await lookup.json() as { id: number }[];
  const localId = rows[0]?.id;
  if (!localId) return null;
  await sb(`billing_subscriptions?id=eq.${localId}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  return localId;
}

async function updatePaymentByIntent(paymentIntentId: string, patch: Record<string, unknown>) {
  const invoices = await sb(`invoices?stripe_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}&select=id`);
  if (!invoices.ok) return;
  const rows = await invoices.json() as { id: number }[];
  const invoiceId = rows[0]?.id;
  if (!invoiceId) return;
  await sb(`payments?invoice_id=eq.${invoiceId}&order=paid_at.desc&limit=1`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") return json({ ok: true, service: "webforge-stripe-webhook" });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const signature = req.headers.get("stripe-signature") || "";
    const payload = await req.text();
    const secret = await getWebhookSecret();
    if (!(await verifyStripeSignature(payload, signature, secret))) return json({ ok: false, error: "invalid_signature" }, 400);

    const event = JSON.parse(payload) as { id: string; type: string; data: { object: Record<string, unknown> } };
    const insertEvent = await sb("stripe_webhook_events?on_conflict=event_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ event_id: event.id, event_type: event.type }),
    });
    if (!insertEvent.ok) throw new Error(`EVENT_LOG_${insertEvent.status}`);
    const inserted = await insertEvent.json() as unknown[];
    if (inserted.length === 0) return json({ ok: true, duplicate: true });

    try {
      await processEvent(event);
    } catch (error) {
      // The idempotency marker is already written, so a Stripe retry would be
      // dismissed as a duplicate and the event lost. Drop the marker first.
      await sb(`stripe_webhook_events?event_id=eq.${encodeURIComponent(event.id)}`, { method: "DELETE" })
        .catch((cleanupError) => console.error("WEBFORGE_STRIPE_EVENT_CLEANUP_FAILED", event.id, cleanupError));
      throw error;
    }

    return json({ ok: true });
  } catch (error) {
    console.error("WEBFORGE_STRIPE_WEBHOOK_ERROR", error);
    return json({ ok: false }, 500);
  }
});

async function processEvent(event: { id: string; type: string; data: { object: Record<string, unknown> } }) {
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

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSubId = typeof object.id === "string" ? object.id : null;
    if (stripeSubId) {
      const stripeStatus = typeof object.status === "string" ? object.status : "";
      const status = event.type === "customer.subscription.deleted" || ["canceled","unpaid","incomplete_expired"].includes(stripeStatus)
        ? "cancelled"
        : ["past_due","incomplete"].includes(stripeStatus)
          ? "past_due"
          : stripeStatus === "paused" ? "paused" : "active";
      await updateSubscriptionByStripeId(stripeSubId, { status });
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const stripeSubId = stripeSubscriptionId(object);
    if (stripeSubId) {
      const localSubscriptionId = await updateSubscriptionByStripeId(stripeSubId, {
        status: event.type === "invoice.paid" ? "active" : "past_due",
      });

      if (event.type === "invoice.paid" && localSubscriptionId) {
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
          const externalPaymentId = paymentIntent || stripeInvoiceId || event.id;
          // Requires the unique index added in migration 002 and corrected in 006.
          // Without it
          // PostgREST cannot resolve on_conflict and the insert fails.
          const payment = await sb("payments?on_conflict=external_payment_id", {
            method: "POST",
            headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
            body: JSON.stringify({
              invoice_id: invoiceId,
              amount_cents: amountPaid,
              method: "stripe",
              reference: stripeInvoiceId || event.id,
              paid_at: new Date().toISOString(),
              external_payment_id: externalPaymentId,
              status: "succeeded",
            }),
          });
          if (!payment.ok) throw new Error(`PAYMENT_INSERT_${payment.status}: ${(await payment.text()).slice(0, 300)}`);
        }
      }
    }
  }

  if (event.type === "charge.refunded") {
    const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
    const amount = Number(object.amount || 0);
    const amountRefunded = Number(object.amount_refunded || 0);
    if (paymentIntent && Number.isSafeInteger(amountRefunded) && amountRefunded >= 0) {
      await updatePaymentByIntent(paymentIntent, {
        refunded_cents: amountRefunded,
        status: amountRefunded >= amount && amount > 0 ? "refunded" : "partially_refunded",
      });
    }
  }

  if (event.type === "charge.dispute.created") {
    const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
    if (paymentIntent) await updatePaymentByIntent(paymentIntent, { status: "disputed", dispute_status: "open" });
  }
}
