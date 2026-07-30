import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.email !== "producthubreview@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.ADMIN_FIX_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const plan = req.nextUrl.searchParams.get("plan") || "STARTER";

  await db.user.update({
    where: { id: session.user.id },
    data: { plan: plan as any, subscriptionStatus: "active" },
  });

  return NextResponse.json({ success: true, plan });
}
