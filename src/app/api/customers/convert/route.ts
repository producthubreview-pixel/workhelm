import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { leadId } = body;

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  // Find the lead
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== userId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Check if already converted
  const existingCustomer = await db.customer.findUnique({
    where: { convertedFromLeadId: leadId },
  });
  if (existingCustomer) {
    return NextResponse.json(
      { error: "This lead has already been converted to a customer", customer: existingCustomer },
      { status: 409 }
    );
  }

  // Create customer from lead data
  const customer = await db.customer.create({
    data: {
      userId,
      name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.firstName,
      phone: lead.phone,
      email: lead.email,
      serviceAddress: lead.serviceAddress,
      notes: lead.notes,
      convertedFromLeadId: lead.id,
    },
  });

  // Update lead status to WON and add a note
  const conversionNote = `[${new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}] Converted to customer (Customer ID: ${customer.id})`;

  const updatedNotes = lead.notes
    ? `${lead.notes}\n\n${conversionNote}`
    : conversionNote;

  await db.lead.update({
    where: { id: lead.id },
    data: {
      status: "WON",
      notes: updatedNotes,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
