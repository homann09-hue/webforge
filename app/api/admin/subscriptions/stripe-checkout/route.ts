import { NextResponse } from "next/server";
import { listBillingSubscriptions, setBillingSubscriptionStripe } from "@/lib/subscriptions";

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: "Stripe ist noch nicht konfiguriert." }, { status: 503 });
    }

    const body = await req.json();
    const password = String(body.password || "");
    const subscriptionId = Number(body.subscriptionId);
    if (!password || !Number.isSafeInteger(subscriptionId) || subscriptionId <= 0) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    const subscriptions = await listBillingSubscriptions(password);
    const subscription = subscriptions.find((item) => item.id === subscriptionId);
    if (!subscription) return NextResponse.json({ ok: false, error: "Abo nicht gefunden." }, { status: 404 });
    if (subscription.status === "cancelled")
      return NextResponse.json({ ok: false, error: "Storniertes Abo kann nicht aktiviert werden." }, { status: 400 });

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

    const session = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!response.ok || !session.url) {
      console.error("WEBFORGE_STRIPE_CHECKOUT_ERROR", response.status, session.error?.message || session);
      return NextResponse.json(
        { ok: false, error: session.error?.message || "Stripe Checkout konnte nicht erstellt werden." },
        { status: 502 },
      );
    }

    await setBillingSubscriptionStripe(password, subscription.id, { checkoutUrl: session.url });
    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED")
      return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_STRIPE_CHECKOUT_REQUEST_ERROR", error);
    return NextResponse.json({ ok: false, error: "Stripe Checkout konnte nicht erstellt werden." }, { status: 500 });
  }
}
