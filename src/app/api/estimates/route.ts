import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimateFormSchema } from "@/lib/estimate-schema";
import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { DEFAULT_TEMPLATES, fillTemplate } from "@/lib/template-defaults";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Prisma.EstimateWhereInput = { userId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status as any;
  }

  const estimates = await db.estimate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      followUps: {
        select: { id: true },
      },
    },
  });

  const result = estimates.map(({ followUps, ...e }) => ({
    ...e,
    followUpCount: followUps.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const parsed = estimateFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify customer belongs to user
  const customer = await db.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer || customer.userId !== userId) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 400 }
    );
  }

  // Sent estimates are followed up three days later by default, matching the
  // existing Mark as Sent flow for legacy draft estimates.
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const estimate = await db.estimate.create({
    data: {
      userId,
      customerId: data.customerId,
      title: data.title,
      amount: data.amount ?? null,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      nextFollowUpAt: threeDaysFromNow,
      notes: data.notes || null,
      status: "SENT",
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      user: { select: { businessName: true } },
    },
  });

  // Email delivery failures must not prevent the estimate from being created.
  if (estimate.customer.email) {
    try {
      const savedTemplate = await db.messageTemplate.findFirst({
        where: { userId, category: "ESTIMATE_SENT" },
      });
      const template = savedTemplate || DEFAULT_TEMPLATES.find((item) => item.category === "ESTIMATE_SENT")!;
      const values = {
        "{{name}}": estimate.customer.name,
        "{{business}}": estimate.user.businessName || "our team",
        "{{service}}": estimate.title,
        "{{expires}}": estimate.expiresAt
          ? estimate.expiresAt.toLocaleDateString()
          : "the stated expiration date",
      };
      const amount = estimate.amount == null
        ? "an amount to be confirmed"
        : `$${estimate.amount.toFixed(2)}`;
      await sendEmail({
        to: estimate.customer.email,
        subject: fillTemplate(template.subject, values),
        body: `${fillTemplate(template.body, values)}\n\nEstimate amount: ${amount}\nPlease reply to this email with any questions or to approve the work.`,
      });
    } catch (error) {
      console.error("Failed to send estimate email:", error);
    }
  }

  return NextResponse.json(estimate, { status: 201 });
}
