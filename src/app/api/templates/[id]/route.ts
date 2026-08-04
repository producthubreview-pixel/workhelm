import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;
  const body = await req.json();

  // Verify the template belongs to the user
  const existing = await db.messageTemplate.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== userId) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  const updated = await db.messageTemplate.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : existing.name,
      subject: body.subject !== undefined ? String(body.subject) : existing.subject,
      body: body.body !== undefined ? String(body.body) : existing.body,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
    },
  });

  return NextResponse.json(updated);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;
  const body = await req.json();

  // Verify the template belongs to the user
  const existing = await db.messageTemplate.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== userId) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  // PATCH is used to toggle the enabled flag
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be a boolean" },
      { status: 400 }
    );
  }

  const updated = await db.messageTemplate.update({
    where: { id },
    data: { enabled: body.enabled },
  });

  return NextResponse.json(updated);
}
