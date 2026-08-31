import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  if (!STRIPE_SECRET) {
    return NextResponse.json(
      { error: "پرداخت هنوز فعال نشده است" },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan?: string };
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "پلن نامعتبر" }, { status: 400 });
  }

  const priceId = plan === "monthly"
    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY;

  if (!priceId) {
    return NextResponse.json(
      { error: "قیمت‌گذاری این پلن تنظیم نشده است" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET);

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: profile?.tenant_id ?? user.id,
    subscription_data: {
      metadata: {
        tenant_id: profile?.tenant_id ?? user.id,
        user_id: user.id,
      },
    },
    success_url: `${APP_URL}/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/dashboard?checkout=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
