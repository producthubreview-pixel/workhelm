import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const estimateStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  declinedReason: z.string().optional(),
});

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

  const body = await req.json();
  const parsed = estimateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, any> = { status: parsed.data.status };
  if (parsed.data.status === "DECLINED") {
    updateData.declinedReason = parsed.data.declinedReason || null;
  }

  const updated = await db.estimate.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
