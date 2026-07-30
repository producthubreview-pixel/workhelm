import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const userId = session.user.id;
  const body = await req.json();
  const { priceId, plan } = body;

  const priceIds: Record<string, string | undefined> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
  };

  const resolvedPriceId = priceId || priceIds[plan];
  if (!resolvedPriceId) {
    return NextResponse.json(
      { error: "Invalid plan selected" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let stripeCustomerId = user.stripeCustomerId;

  // Create Stripe customer if doesn't exist
  if (!stripeCustomerId && user.email) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });
  }

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "Cannot create checkout session without email" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: resolvedPriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/app/settings?billing=success`,
    cancel_url: `${baseUrl}/app/settings?billing=cancelled`,
    metadata: { userId, plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

// Helper: check if user is still in trial
async function isInTrial(uid: string): Promise<boolean> {
  const dbUser = await db.user.findUnique({
    where: { id: uid },
    select: { subscriptionStatus: true, trialEndsAt: true, stripeSubscriptionId: true },
  });

  if (!dbUser) return false;
  if (dbUser.stripeSubscriptionId) return false;

  if (
    dbUser.subscriptionStatus === "trialing" &&
    dbUser.trialEndsAt &&
    new Date(dbUser.trialEndsAt) > new Date()
  ) {
    return true;
  }

  return false;
}
