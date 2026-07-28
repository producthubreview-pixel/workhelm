import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const estimate = await db.estimate.findUnique({ where: { id } });
  if (!estimate || estimate.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (estimate.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft estimates can be marked as sent" },
      { status: 400 }
    );
  }

  // Set nextFollowUpAt to 3 days from now as default
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const updated = await db.estimate.update({
    where: { id },
    data: {
      status: "SENT",
      nextFollowUpAt: threeDaysFromNow,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
