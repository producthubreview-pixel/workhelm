import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATES } from "@/lib/template-defaults";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const templates = await db.messageTemplate.findMany({
    where: { userId },
    orderBy: { category: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if any templates already exist for this user
  const existingCount = await db.messageTemplate.count({
    where: { userId },
  });

  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Templates already seeded" },
      { status: 400 }
    );
  }

  // Seed default templates
  const created = await db.messageTemplate.createMany({
    data: DEFAULT_TEMPLATES.map((t) => ({
      userId,
      name: t.name,
      subject: t.subject,
      body: t.body,
      category: t.category,
    })),
  });

  // Return the newly created templates
  const templates = await db.messageTemplate.findMany({
    where: { userId },
    orderBy: { category: "asc" },
  });

  return NextResponse.json(templates, { status: 201 });
}
