import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
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

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      stripeSubscriptionId: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No Stripe subscription found" },
      { status: 404 }
    );
  }

  // Fetch current state from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId
  );

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? "PRO" : "STARTER";
  const isCanceled = subscription.cancel_at_period_end;
  const status = subscription.status; // active, past_due, etc.

  const newStatus = isCanceled ? "canceled" : status;

  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: newStatus,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });

  return NextResponse.json({
    plan,
    subscriptionStatus: newStatus,
    canceled: isCanceled,
    currentPeriodEnd: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
  });
}
