import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { listBillingSubscriptions, setBillingSubscriptionStripe } from "@/lib/subscriptions";

export async function POST(req: Request) {
  try {
    const adminSession = await requireAdminSession();

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: "Stripe ist noch nicht konfiguriert." }, { status: 503 });
    }

    const body = await req.json();
    const subscriptionId = Number(body.subscriptionId);
    if (!Number.isSafeInteger(subscriptionId) || subscriptionId <= 0) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    const subscriptions = await listBillingSubscriptions(adminSession);
    const subscription = subscriptions.find((item) => item.id === subscriptionId);
    if (!subscription) return NextResponse.json({ ok: false, error: "Abo nicht gefunden." }, { status: 404 });
    if (subscription.status === "cancelled") {
      return NextResponse.json({ ok: false, error: "Storniertes Abo kann nicht aktiviert werden." }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("customer_email", subscription.email);
    params.set("success_url", `${origin}/admin/subscriptions?stripe=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${origin}/admin/subscriptions?stripe=cancelled`);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "eur");
    params.set("line_items[0][price_data][unit_amount]", String(subscription.amount_cents));
    params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set("line_items[0][price_data][product_data][name]", subscription.name);
    params.set("metadata[webforge_subscription_id]", String(subscription.id));
    params.set("subscription_data[metadata][webforge_subscription_id]", String(subscription.id));

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const checkout = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!response.ok || !checkout.url) {
      console.error("WEBFORGE_STRIPE_CHECKOUT_ERROR", response.status, checkout.error?.message || checkout);
      return NextResponse.json(
        { ok: false, error: checkout.error?.message || "Stripe Checkout konnte nicht erstellt werden." },
        { status: 502 },
      );
    }

    await setBillingSubscriptionStripe(adminSession, subscription.id, { checkoutUrl: checkout.url });
    return NextResponse.json({ ok: true, url: checkout.url, sessionId: checkout.id });
  } catch (error) {
    return adminErrorResponse(error, "Stripe Checkout konnte nicht erstellt werden.");
  }
}
