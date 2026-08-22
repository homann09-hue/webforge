import { NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon-db";
import { verifyStripeSignature } from "@/lib/stripe-signature";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function firstRow(result: unknown): Record<string, unknown> | undefined {
  return Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === "object"
    ? (result[0] as Record<string, unknown>)
    : undefined;
}

function stripeSubscriptionId(invoice: Record<string, unknown>) {
  if (typeof invoice.subscription === "string") return invoice.subscription;
  const parent = invoice.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  return typeof details?.subscription === "string" ? details.subscription : null;
}

async function updateSubscriptionByStripeId(stripeSubscriptionId: string, patch: { status: string }) {
  const sql = getNeonSql();
  const result = await sql`
    update public.billing_subscriptions
    set status = ${patch.status}, updated_at = now()
    where stripe_subscription_id = ${stripeSubscriptionId}
    returning id
  `;
  const row = firstRow(result);
  return row?.id ? Number(row.id) : null;
}

async function updatePaymentByIntent(
  paymentIntentId: string,
  patch: { refunded_cents?: number; status?: string; dispute_status?: string },
) {
  const sql = getNeonSql();
  const invoiceResult = await sql`
    select id
    from public.invoices
    where stripe_payment_intent_id = ${paymentIntentId}
    limit 1
  `;
  const invoiceRow = firstRow(invoiceResult);
  const invoiceId = invoiceRow?.id ? Number(invoiceRow.id) : null;
  if (!invoiceId) return;

  const paymentResult = await sql`
    select id
    from public.payments
    where invoice_id = ${invoiceId}
    order by paid_at desc
    limit 1
  `;
  const paymentRow = firstRow(paymentResult);
  const paymentId = paymentRow?.id ? Number(paymentRow.id) : null;
  if (!paymentId) return;

  await sql`
    update public.payments
    set
      refunded_cents = coalesce(${patch.refunded_cents ?? null}, refunded_cents),
      status = coalesce(${patch.status ?? null}, status),
      dispute_status = coalesce(${patch.dispute_status ?? null}, dispute_status)
    where id = ${paymentId}
  `;
}

async function processEvent(event: { id: string; type: string; data: { object: Record<string, unknown> } }) {
  const sql = getNeonSql();
  const object = event.data.object;

  if (event.type === "checkout.session.completed") {
    const metadata = (object.metadata || {}) as Record<string, unknown>;
    const localId = Number(metadata.webforge_subscription_id);
    if (Number.isSafeInteger(localId) && localId > 0) {
      await sql`
        update public.billing_subscriptions
        set
          stripe_customer_id = ${typeof object.customer === "string" ? object.customer : null},
          stripe_subscription_id = ${typeof object.subscription === "string" ? object.subscription : null},
          status = 'active',
          stripe_checkout_url = null,
          updated_at = now()
        where id = ${localId}
      `;
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSubId = typeof object.id === "string" ? object.id : null;
    if (stripeSubId) {
      const stripeStatus = typeof object.status === "string" ? object.status : "";
      const status =
        event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(stripeStatus)
          ? "cancelled"
          : ["past_due", "incomplete"].includes(stripeStatus)
            ? "past_due"
            : stripeStatus === "paused"
              ? "paused"
              : "active";
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
        const invoiceResult = await sql`
          select id
          from public.invoices
          where recurring_subscription_id = ${localSubscriptionId}
            and status in ('open', 'overdue')
          order by issue_date desc
          limit 1
        `;
        const invoiceRow = firstRow(invoiceResult);
        const invoiceId = invoiceRow?.id ? Number(invoiceRow.id) : null;
        const amountPaid = Number(object.amount_paid || 0);
        if (invoiceId && Number.isSafeInteger(amountPaid) && amountPaid > 0) {
          const stripeInvoiceId = typeof object.id === "string" ? object.id : null;
          const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
          await sql`
            update public.invoices
            set
              stripe_invoice_id = ${stripeInvoiceId},
              stripe_payment_intent_id = ${paymentIntent},
              updated_at = now()
            where id = ${invoiceId}
          `;

          const externalPaymentId = paymentIntent || stripeInvoiceId || event.id;
          await sql`
            insert into public.payments(
              invoice_id, amount_cents, method, reference, paid_at,
              external_payment_id, status
            ) values (
              ${invoiceId}, ${amountPaid}, 'stripe', ${stripeInvoiceId || event.id}, now(),
              ${externalPaymentId}, 'succeeded'
            )
            on conflict (external_payment_id) do nothing
          `;
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

export async function GET() {
  return json({ ok: true, service: "webforge-stripe-webhook" });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret.startsWith("whsec_")) {
    console.error("WEBFORGE_STRIPE_WEBHOOK_SECRET_MISSING");
    return json({ ok: false }, 500);
  }

  const signature = req.headers.get("stripe-signature") || "";
  const payload = await req.text();
  if (!(await verifyStripeSignature(payload, signature, secret))) {
    return json({ ok: false, error: "invalid_signature" }, 400);
  }

  let event: { id: string; type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  if (!event.id || !event.type || !event.data?.object) {
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  const sql = getNeonSql();
  try {
    const insertedResult = await sql`
      insert into public.stripe_webhook_events(event_id, event_type)
      values (${event.id}, ${event.type})
      on conflict (event_id) do nothing
      returning event_id
    `;
    if (!firstRow(insertedResult)?.event_id) return json({ ok: true, duplicate: true });

    try {
      await processEvent(event);
    } catch (error) {
      await sql`delete from public.stripe_webhook_events where event_id = ${event.id}`.catch((cleanupError) =>
        console.error("WEBFORGE_STRIPE_EVENT_CLEANUP_FAILED", event.id, cleanupError),
      );
      throw error;
    }

    return json({ ok: true });
  } catch (error) {
    console.error("WEBFORGE_STRIPE_WEBHOOK_ERROR", error);
    return json({ ok: false }, 500);
  }
}
