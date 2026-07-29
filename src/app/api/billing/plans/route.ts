import { NextResponse } from "next/server";

export async function GET() {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      priceId: process.env.STRIPE_STARTER_PRICE_ID || null,
      interval: "month",
      features: [
        "1 user seat",
        "Up to 250 leads",
        "Lead & customer management",
        "Estimate tracking",
        "Follow-up reminders",
        "Sales pipeline (kanban)",
        "Message templates",
        "Basic reports",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 59,
      priceId: process.env.STRIPE_PRO_PRICE_ID || null,
      interval: "month",
      features: [
        "Up to 5 user seats",
        "Unlimited leads",
        "Everything in Starter",
        "Priority support",
        "Advanced reporting (coming soon)",
        "Custom templates (coming soon)",
      ],
      highlighted: true,
    },
  ];

  return NextResponse.json({ plans });
}
