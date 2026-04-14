-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "assignedUserId" TEXT;

-- CreateIndex
CREATE INDEX "ticket_assignedUserId_idx" ON "ticket"("assignedUserId");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
