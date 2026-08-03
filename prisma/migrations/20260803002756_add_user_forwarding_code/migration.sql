-- AlterTable
ALTER TABLE "User" ADD COLUMN "forwardingCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_forwardingCode_key" ON "User"("forwardingCode");
