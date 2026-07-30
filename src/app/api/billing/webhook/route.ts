import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(checkoutSession);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEnded(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  const plan = session.metadata?.plan || "starter";
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  // Fetch subscription details from Stripe
  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);

  await db.user.update({
    where: { id: userId },
    data: {
      plan: plan.toUpperCase() as any,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: subscription.status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });

  console.log(`Subscription created for user ${userId}: ${plan} (${subscription.status})`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? "PRO" : "STARTER";

  // Track cancellation intent: user canceled but still has access until period end
  const isCanceled = subscription.cancel_at_period_end;

  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: isCanceled ? "canceled" : subscription.status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });

  console.log(
    `Subscription updated for user ${userId}: ${plan} (${subscription.status})${isCanceled ? " [canceled at period end]" : ""}`
  );
}

async function handleSubscriptionEnded(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  // Check lead count before downgrading
  const leadCount = await db.lead.count({ where: { userId } });

  if (leadCount <= 5) {
    // Safe to downgrade to Free
    await db.user.update({
      where: { id: userId },
      data: {
        plan: "FREE",
        subscriptionStatus: null,
        stripeSubscriptionId: null,
        trialEndsAt: null,
      },
    });
    console.log(`Subscription ended for user ${userId}: downgraded to FREE (${leadCount} leads)`);
  } else {
    // Too many leads — lock account instead of downgrading
    await db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "locked",
        stripeSubscriptionId: null,
      },
    });
    console.log(`Subscription ended for user ${userId}: locked (${leadCount} leads exceed Free limit)`);
  }
}
