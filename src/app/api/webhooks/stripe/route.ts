import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const stripe = new Stripe(STRIPE_SECRET);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;
    const tenantId = session.client_reference_id;

    if (tenantId && subscriptionId) {
      await supabase.from("subscriptions").upsert(
        {
          tenant_id: tenantId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: "monthly",
          status: "active",
          starts_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
      period_end?: number;
    };
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;
    if (subscriptionId) {
      const { data } = await supabase
        .from("subscriptions")
        .select("tenant_id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (data) {
        const endsAt = invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null;
        await supabase
          .from("subscriptions")
          .update({ status: "active", ...(endsAt ? { ends_at: endsAt } : {}) })
          .eq("tenant_id", data.tenant_id);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription & {
      current_period_end?: number;
    };
    const tenantId = subscription.metadata?.tenant_id;
    if (tenantId) {
      const endsAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          plan:
            subscription.items.data[0]?.price?.recurring?.interval === "year"
              ? "yearly"
              : "monthly",
          ...(endsAt ? { ends_at: endsAt } : {}),
        })
        .eq("tenant_id", tenantId);
    }
  }

  return NextResponse.json({ received: true });
}
