-- Estimates can now link directly to a lead (before conversion) or a customer.
-- customerId becomes optional; leadId is the new optional direct link.
ALTER TABLE "Estimate" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "Estimate" ADD COLUMN "leadId" TEXT;

-- CreateIndex
CREATE INDEX "Estimate_leadId_idx" ON "Estimate"("leadId");

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
