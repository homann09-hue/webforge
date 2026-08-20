import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabase-env";
import { verifyStripeSignature } from "@/lib/stripe-signature";

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

/**
 * Like `sb`, but treats a non-2xx response as a thrown error.
 *
 * Stripe retries a webhook that does not return 2xx. Previously a failed
 * write here was ignored and the endpoint still answered 200, which meant a
 * customer could pay without the payment ever being recorded and without
 * anyone finding out. Throwing turns that into a 500 and lets Stripe retry.
 */
async function sbOrThrow(label: string, path: string, options: RequestInit = {}) {
  const response = await sb(path, options);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${label}_${response.status}: ${detail.slice(0, 300)}`);
  }
  return response;
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
    if (!webhookSecret) {
      return NextResponse.json({ ok: false, error: "Stripe webhook not configured" }, { status: 503 });
    }

    const signature = req.headers.get("stripe-signature") || "";
    const payload = await req.text();
    if (!(await verifyStripeSignature(payload, signature, webhookSecret))) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload) as { id: string; type: string; data: { object: Record<string, unknown> } };

    // Idempotency: the insert only succeeds the first time this event id is
    // seen, so a Stripe retry cannot double-book a payment.
    const insertEvent = await sbOrThrow("EVENT_LOG", "stripe_webhook_events?on_conflict=event_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ event_id: event.id, event_type: event.type }),
    });
    const inserted = (await insertEvent.json()) as unknown[];
    if (inserted.length === 0) return NextResponse.json({ ok: true, duplicate: true });

    try {
      await processEvent(event);
    } catch (error) {
      // The event marker is already written, so a Stripe retry would be
      // dismissed as a duplicate and the event would be lost. Remove the
      // marker before failing so the retry actually reprocesses it.
      await sb(`stripe_webhook_events?event_id=eq.${encodeURIComponent(event.id)}`, { method: "DELETE" }).catch(
        (cleanupError) => console.error("WEBFORGE_STRIPE_EVENT_CLEANUP_FAILED", event.id, cleanupError),
      );
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Returning 500 makes Stripe retry with backoff.
    console.error("WEBFORGE_STRIPE_WEBHOOK_ERROR", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/**
 * Applies one verified Stripe event. Every write throws on failure; the caller
 * turns that into a 500 so Stripe retries. The payment insert is deliberately
 * the last write, so a failure never leaves a recorded payment behind.
 */
async function processEvent(event: { id: string; type: string; data: { object: Record<string, unknown> } }) {
  const object = event.data.object;

  if (event.type === "checkout.session.completed") {
    const metadata = (object.metadata || {}) as Record<string, unknown>;
    const localId = Number(metadata.webforge_subscription_id);
    if (Number.isSafeInteger(localId) && localId > 0) {
      await sbOrThrow("CHECKOUT_PATCH", `billing_subscriptions?id=eq.${localId}`, {
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
      const lookup = await sbOrThrow(
        "SUB_LOOKUP",
        `billing_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubId)}&select=id`,
      );
      const rows = (await lookup.json()) as { id: number }[];
      const localSubscriptionId = rows[0]?.id;

      if (localSubscriptionId) {
        await sbOrThrow("SUB_STATUS", `billing_subscriptions?id=eq.${localSubscriptionId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: event.type === "invoice.paid" ? "active" : "past_due",
            updated_at: new Date().toISOString(),
          }),
        });

        if (event.type === "invoice.paid") {
          const invoices = await sbOrThrow(
            "INVOICE_LOOKUP",
            `invoices?recurring_subscription_id=eq.${localSubscriptionId}&status=in.(open,overdue)` +
              `&order=issue_date.desc&limit=1&select=id`,
          );
          const invoiceRows = (await invoices.json()) as { id: number }[];
          const invoiceId = invoiceRows[0]?.id;
          const amountPaid = Number(object.amount_paid || 0);

          if (invoiceId && Number.isSafeInteger(amountPaid) && amountPaid > 0) {
            const stripeInvoiceId = typeof object.id === "string" ? object.id : null;
            const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;

            await sbOrThrow("INVOICE_PATCH", `invoices?id=eq.${invoiceId}`, {
              method: "PATCH",
              body: JSON.stringify({
                stripe_invoice_id: stripeInvoiceId,
                stripe_payment_intent_id: paymentIntent,
                updated_at: new Date().toISOString(),
              }),
            });

            await sbOrThrow("PAYMENT_INSERT", "payments", {
              method: "POST",
              headers: { Prefer: "return=minimal" },
              body: JSON.stringify({
                invoice_id: invoiceId,
                amount_cents: amountPaid,
                method: "stripe",
                reference: stripeInvoiceId || event.id,
                paid_at: new Date().toISOString(),
              }),
            });
          } else if (!invoiceId) {
            // Not an error: a paid Stripe invoice with no matching open local
            // invoice simply means nothing to reconcile. Log it so a genuine
            // mismatch is visible rather than silent.
            console.warn("WEBFORGE_STRIPE_NO_OPEN_INVOICE", localSubscriptionId, event.id);
          }
        }
      } else {
        console.warn("WEBFORGE_STRIPE_UNKNOWN_SUBSCRIPTION", stripeSubId, event.id);
      }
    }
  }
}
