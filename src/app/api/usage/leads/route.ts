import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PLAN_LIMITS: Record<string, number> = {
  FREE: 5,
  STARTER: 250,
  PRO: Infinity,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, leadCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    db.lead.count({ where: { userId } }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const plan = user.plan;
  const limit = PLAN_LIMITS[plan] ?? 5;

  return NextResponse.json({ count: leadCount, plan, limit });
}
