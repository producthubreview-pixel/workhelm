import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate trial remaining
  const now = new Date();
  let trialRemaining: number | null = null;

  if (
    user.subscriptionStatus === "trialing" &&
    user.trialEndsAt &&
    new Date(user.trialEndsAt) > now
  ) {
    trialRemaining = Math.ceil(
      (new Date(user.trialEndsAt).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return NextResponse.json({
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    trialEndsAt: user.trialEndsAt,
    trialRemaining,
    hasPaymentMethod: !!user.stripeCustomerId,
    stripeConfigured: isStripeConfigured(),
    email: user.email,
  });
}
